const fs = require('fs')
const path = require('path')
const { readJson, writeJson } = require('fs-extra')
const flatten = require('truffle-flattener')
const extract = require('../../../helpers/solidity-extractor')
const namehash = require('eth-ens-namehash')
const taskInput = require('listr-input')
const { keccak256 } = require('js-sha3')

const { ARTIFACT_FILE } = require('./preprare-files')
const SOLIDITY_FILE = 'code.sol'
const ARAPP_FILE = 'arapp.json'

const POSITIVE_ANSWERS = ['yes', 'y']
const NEGATIVE_ANSWERS = ['no', 'n', 'abort', 'a']
const ANSWERS = POSITIVE_ANSWERS.concat(NEGATIVE_ANSWERS)

const getMajor = version => version.split('.')[0]

const getRoles = roles =>
  roles.map(role => Object.assign(role, { bytes: '0x' + keccak256(role.id) }))

async function getEnvironments(cwd) {
  const arappManifestPath = path.resolve(cwd, ARAPP_FILE)
  const arappManifestFile = await readJson(arappManifestPath)
  return arappManifestFile.environments
}

async function getContractAbi(cwd, contractPath) {
  const contractInterfacePath = path.resolve(
    cwd,
    'build/contracts',
    path.basename(contractPath, '.sol') + '.json'
  )
  const contractInterface = await readJson(contractInterfacePath)
  return contractInterface.abi
}

function decorateFunctionsWithAbi(functions, abi, web3) {
  const abiFunctions = abi.filter(elem => elem.type === 'function')
  functions.forEach(f => {
    f.abi = abiFunctions.find(
      elem =>
        web3.eth.abi.encodeFunctionSignature(elem) ===
        web3.eth.abi.encodeFunctionSignature(f.sig)
    )
  })
}

async function deprecatedFunctions(apm, artifact, web3, reporter) {
  const deprecatedFunctions = {}
  try {
    const deprecatedFunctionsSig = new Set()
    const versions = await apm.getAllVersions(artifact.appName)
    let lastMajor = -1
    versions.reverse().forEach(async version => {
      let deprecatedOnVersion = []
      // iterate on major versions
      if (getMajor(version.version) !== lastMajor) {
        lastMajor = getMajor(version.version)
        if (version.functions) {
          version.functions.forEach(f => {
            if (
              !artifact.functions.some(obj => obj.sig === f.sig) &&
              !deprecatedFunctionsSig.has(f.sig)
            ) {
              deprecatedOnVersion.push(f)
              deprecatedFunctionsSig.add(f.sig)
            }
          })
          if (deprecatedOnVersion.length) {
            deprecatedFunctions[`${lastMajor}.0.0`] = deprecatedOnVersion
            decorateFunctionsWithAbi(deprecatedOnVersion, version.abi, web3)
            deprecatedOnVersion = []
          }
        } else {
          reporter.warning(
            `Cannot find artifacts for version ${version.version} in aragonPM. Please make sure the package was published and your IPFS or HTTP server are running.\n`
          )
          return taskInput(`Abort publication? [y]es/[n]o`, {
            validate: value => {
              return ANSWERS.indexOf(value) > -1
            },
            done: async answer => {
              if (POSITIVE_ANSWERS.indexOf(answer) > -1) {
                throw new Error('Aborting publication...')
              }
            },
          })
        }
      }
    })
  } catch (e) {
    // Catch ENS error on first version
  }
  return deprecatedFunctions
}

async function generateApplicationArtifact(
  cwd,
  apm,
  outputPath,
  module,
  deployArtifacts,
  web3,
  reporter
) {
  // Set appName, path & roles
  let artifact = Object.assign({}, module)

  // Set `appId`
  artifact.appId = namehash.hash(artifact.appName)

  // Set environments
  artifact.environments = await getEnvironments(cwd)

  // Set ABI
  artifact.abi = await getContractAbi(cwd, artifact.path)

  if (deployArtifacts) {
    artifact.deployment = deployArtifacts
    artifact.deployment.flattenedCode = `./${SOLIDITY_FILE}`
  }

  console.log('before extract')

  // Analyse contract functions and returns an array
  // > [{ sig: 'transfer(address)', role: 'X_ROLE', notice: 'Transfers..'}]
  artifact.functions = await extract(path.resolve(cwd, artifact.path))

  console.log('after extract')

  // extract abi for each function
  // > [{ sig: , role: , notice: , abi: }]
  decorateFunctionsWithAbi(artifact.functions, artifact.abi, web3)

  console.log('before deprecated')
  // Consult old (major) version's artifacts and return an array
  // of deprecated functions per version
  // > "deprecatedFunctions": { "1.0.0": [{}], "2.0.0": [{}] }
  artifact.deprecatedFunctions = await deprecatedFunctions(
    apm,
    artifact,
    web3,
    reporter
  )

  console.log('after deprecated')

  if (artifact.roles) {
    getRoles(artifact.roles)
  }

  // Save artifact
  await writeJson(path.resolve(outputPath, ARTIFACT_FILE), artifact, {
    spaces: '\t',
  })

  return artifact
}

async function generateFlattenedCode(dir, sourcePath) {
  const flattenedCode = await flatten([sourcePath])
  fs.writeFileSync(path.resolve(dir, SOLIDITY_FILE), flattenedCode)
}

// Sanity check artifact.json
async function sanityCheck(cwd, newRoles, newContractPath, oldArtifact) {
  const { roles, environments, abi, path } = oldArtifact

  const newContractRoles = await getRoles(newRoles)
  const newContractEnvironments = await getEnvironments(cwd)
  const newContractAbi = await getContractAbi(cwd, newContractPath)

  return (
    JSON.stringify(newContractRoles) !== JSON.stringify(roles) ||
    JSON.stringify(newContractEnvironments) !== JSON.stringify(environments) ||
    JSON.stringify(newContractAbi) !== JSON.stringify(abi) ||
    newContractPath !== path
  )
}

async function copyCurrentApplicationArtifacts(
  cwd,
  outputPath,
  apm,
  repo,
  newVersion,
  roles,
  contractPath
) {
  const copyingFiles = [ARTIFACT_FILE, SOLIDITY_FILE]
  const { content } = repo
  const uri = `${content.provider}:${content.location}`

  const copy = await Promise.all(
    copyingFiles.map(async file => {
      try {
        return {
          filePath: path.resolve(outputPath, file),
          fileContent: await apm.getFile(uri, file),
          fileName: file,
        }
      } catch (e) {
        // Only throw if fetching artifact fails, if code can't be found
        // continue as it could be fetched from previous versions
        if (file === ARTIFACT_FILE) {
          throw e
        }
      }
    })
  )

  const updateArtifactVersion = (file, version) => {
    const newContent = JSON.parse(file.fileContent)
    newContent.version = version
    return { ...file, fileContent: JSON.stringify(newContent, null, 2) }
  }

  const evaluateFile = async file => {
    if (file.fileName === ARTIFACT_FILE) {
      const rebuild = await sanityCheck(
        cwd,
        roles,
        contractPath,
        JSON.parse(file.fileContent)
      )
      if (rebuild) {
        throw new Error('Artifact mismatch')
      } else {
        return updateArtifactVersion(file, newVersion)
      }
    }
    return file
  }

  const copyArray = await Promise.all(
    copy.filter(item => item).map(file => evaluateFile(file))
  )

  copyArray.forEach(({ fileName, filePath, fileContent }) =>
    fs.writeFileSync(filePath, fileContent)
  )
}

module.exports = {
  POSITIVE_ANSWERS,
  NEGATIVE_ANSWERS,
  ANSWERS,
  SOLIDITY_FILE,
  getMajor,
  generateApplicationArtifact,
  generateFlattenedCode,
  sanityCheck,
  copyCurrentApplicationArtifacts,
}
