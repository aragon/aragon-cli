const fs = require('fs')
const path = require('path')
const { readJson, writeJson } = require('fs-extra')
const extract = require('../../../helpers/solidity-extractor')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')

const { ARTIFACT_FILE } = require('./preprare-files')
const SOLIDITY_FILE = 'code.sol'

const getMajor = version => version.split('.')[0]

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
            `Cannot find artifacts for version ${
              version.version
            }  in aragonPM repo. Please make sure the package was published and IPFS or your HTTP server running.`
          )
          return deprecated
        }
      }
    })
    return deprecated
  } catch (e) {
    // Catch ENS error on first version
  }
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
  const contractPath = artifact.path
  const contractInterfacePath = path.resolve(
    cwd,
    'build/contracts',
    path.basename(contractPath, '.sol') + '.json'
  )

  // Set `appId`
  artifact.appId = namehash.hash(artifact.appName)

  // Set ABI
  const contractInterface = await readJson(contractInterfacePath)
  artifact.abi = contractInterface.abi

  if (deployArtifacts) {
    artifact.deployment = deployArtifacts
    if (deployArtifacts.flattenedCode) {
      fs.writeFileSync(
        path.resolve(outputPath, SOLIDITY_FILE),
        artifact.deployment.flattenedCode
      )
      artifact.deployment.flattenedCode = `./${SOLIDITY_FILE}`
    }
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

async function copyCurrentApplicationArtifacts(
  outputPath,
  apm,
  repo,
  newVersion
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

  copy
    .filter(item => item)
    .map(file => {
      if (file.fileName === ARTIFACT_FILE) {
        return updateArtifactVersion(file, newVersion)
      }
      return file
    })
    .forEach(({ fileName, filePath, fileContent }) =>
      fs.writeFileSync(filePath, fileContent)
    )
}

module.exports = {
  SOLIDITY_FILE,
  getMajor,
  generateApplicationArtifact,
  copyCurrentApplicationArtifacts,
}
