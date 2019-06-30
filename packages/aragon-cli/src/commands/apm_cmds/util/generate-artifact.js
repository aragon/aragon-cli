const fs = require('fs')
const path = require('path')
const { readJson, writeJson } = require('fs-extra')
const flatten = require('truffle-flattener')
const extract = require('../../../helpers/solidity-extractor')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')

const { ARTIFACT_FILE } = require('./preprare-files')
const SOLIDITY_FILE = 'code.sol'

const getMajor = version => version.split('.')[0]

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
  functions.forEach(f => {
    f.abi = abi.find(
      interfaceObject =>
        web3.eth.abi.encodeFunctionSignature(interfaceObject) ===
        web3.eth.abi.encodeFunctionSignature(f.sig)
    )
  })
}

async function deprecatedFunctions(apm, artifact, web3, reporter) {
  let deprecated = {}
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
            deprecated[`${lastMajor}.0.0`] = deprecatedOnVersion
            decorateFunctionsWithAbi(deprecatedOnVersion, version.abi, web3)
            deprecatedOnVersion = []
          }
        } else {
          reporter.warning(
            `Cannot find artifacts for version ${version.version} in aragonPM repo. Please make sure the package was published and your IPFS or HTTP server are running.`
          )
        }
      }
    })
  } catch (e) {
    // Catch ENS error on first version
  }
  return deprecated
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
  let artifact = Object.assign({}, module)

  // Set `appId`
  artifact.appId = namehash.hash(artifact.appName)

  // Set ABI
  artifact.abi = await getContractAbi(cwd, artifact.path)

  if (deployArtifacts) {
    artifact.deployment = deployArtifacts
    artifact.deployment.flattenedCode = `./${SOLIDITY_FILE}`
  }

  // Analyse contract functions and returns an array
  // > [{ sig: 'transfer(address)', role: 'X_ROLE', notice: 'Transfers..'}]
  artifact.functions = await extract(path.resolve(cwd, artifact.path))
  // extract abi for each function
  // > [{ sig: , role: , notice: , abi: }]
  decorateFunctionsWithAbi(artifact.functions, artifact.abi, web3)

  // Consult old (major) version's artifacts and return an array
  // of deprecated functions per version
  // > "deprecated": { "1.0.0": [{}], "2.0.0": [{}] }
  artifact.deprecated = await deprecatedFunctions(apm, artifact, web3, reporter)

  if (artifact.roles) {
    artifact.roles = artifact.roles.map(role =>
      Object.assign(role, { bytes: '0x' + keccak256(role.id) })
    )
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
async function sanityCheck(cwd, newNetworkName, newArtifact, oldArtifact) {
  const { environments, abi } = oldArtifact
  const firstKey = Object.keys(environments)[0]
  const { appName, registry, network } = environments[firstKey]

  const newContractAbi = await getContractAbi(cwd, newArtifact.path)

  return (
    JSON.stringify(newContractAbi) !== JSON.stringify(abi) ||
    newNetworkName !== network ||
    newArtifact.appName !== appName ||
    newArtifact.registry !== registry ||
    newArtifact.path !== oldArtifact.path
  )
}

async function copyCurrentApplicationArtifacts(
  cwd,
  outputPath,
  apm,
  repo,
  newVersion,
  networkName,
  module
) {
  const copyingFiles = [ARTIFACT_FILE, SOLIDITY_FILE]
  const { content } = repo
  const uri = `${content.provider}:${content.location}`

  const copy = await Promise.all(
    copyingFiles.map(async file => {
      try {
        return {
          filePath: path.resolve(outputPath, file),
          fileContent: JSON.parse(await apm.getFile(uri, file)),
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
    const newContent = file.fileContent
    newContent.version = version
    return { ...file, fileContent: JSON.stringify(newContent, null, 2) }
  }

  const evaluateFile = async file => {
    if (file.fileName === ARTIFACT_FILE) {
      const rebuild = await sanityCheck(
        cwd,
        networkName,
        module,
        file.fileContent
      )
      if (rebuild) {
        throw new Error('Artifact mismatch')
      } else {
        return updateArtifactVersion(file, newVersion)
      }
    }
    return file
  }

  const copyFiles = await Promise.all(
    // TODO: (Gabi) Fix async map handling
    copy.filter(item => item).map(file => evaluateFile(file))
  )

  copyFiles.forEach(({ fileName, filePath, fileContent }) =>
    fs.writeFileSync(filePath, fileContent)
  )
}

module.exports = {
  SOLIDITY_FILE,
  getMajor,
  generateApplicationArtifact,
  generateFlattenedCode,
  sanityCheck,
  copyCurrentApplicationArtifacts,
}
