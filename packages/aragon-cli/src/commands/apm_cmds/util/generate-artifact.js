const fs = require('fs')
const path = require('path')
const { readJson, writeJson } = require('fs-extra')
const flattenCode = require('../../../helpers/flattenCode')
const extract = require('../../../helpers/solidity-extractor')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('web3').utils
const web3EthAbi = require('web3-eth-abi')

const { ARTIFACT_FILE } = require('../../../params')
const SOLIDITY_FILE = 'code.sol'
const ARAPP_FILE = 'arapp.json'

export class MissingFunctionsArtifacts extends Error {}

/**
 * Note: All exported functions are only used by runPrepareForPublishTask.js
 */

/**
 * @typedef {Object} FunctionInfo
 * @property {string} sig "functionName(address,unit)"
 * @property {Object[]} roles
 * @property {string} notice Multiline notice text
 * @property {Object} [abi] Abi of the function
 */

const getMajor = version => version.split('.')[0]

const getRoles = roles =>
  roles.map(role => Object.assign(role, { bytes: keccak256(role.id) }))

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

/**
 * Appends the abi of a function to the functions array
 * @param {FunctionInfo[]} functions
 * @param {Object[]} abi
 * @return {FunctionInfo[]}
 */
function decorateFunctionsWithAbi(functions, abi) {
  const abiFunctions = abi.filter(elem => elem.type === 'function')
  return functions.map(f => ({
    ...f,
    abi: abiFunctions.find(
      functionAbi =>
        web3EthAbi.encodeFunctionSignature(functionAbi) ===
        web3EthAbi.encodeFunctionSignature(f.sig)
    ),
  }))
}

/**
 * Compute which versions have missing artifact so the front-end
 * can alert the user that those will be ignored in the
 * next function getDeprecatedFunctions
 * @param {Object[]} prevVersions
 * @return {string[]} versionsWithMissingArtifact
 */
function getVersionsWithMissingArtifact(prevVersions) {
  // First, make sure that all artifacts are available
  let lastMajor = -1
  const versionsWithMissingArtifact = []
  prevVersions.reverse().forEach(({ version, functions }) => {
    // iterate on major versions
    if (getMajor(version) !== lastMajor) {
      lastMajor = getMajor(version)
      if (!functions) versionsWithMissingArtifact.push(version)
    }
  })
  return versionsWithMissingArtifact
}

/**
 * Computes the deprecated functions.
 * [NOTE] Silently ignores the versions with no artifacts.
 * To know which versions will be ignored, use getVersionsWithMissingArtifact
 * @param {Object} artifact
 * @param {Object[]} prevVersions
 */
function getDeprecatedFunctions(artifact, prevVersions) {
  const deprecatedFunctions = {}
  const deprecatedFunctionsSig = new Set()

  let lastMajor = -1
  prevVersions.reverse().forEach(version => {
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
          decorateFunctionsWithAbi(deprecatedOnVersion, version.abi)
          deprecatedOnVersion = []
        }
      }
    }
  })

  return deprecatedFunctions
}

/**
 * TODO:
 *
 *
 * @param {string} cwd
 * @param {string} outputPath
 * @param {???} deployArtifacts
 * @param {ArappConfigFile} module
 * @param {APM} apm Apm instance
 * @param {Web3} web3 Web3 initialized instance
 */
async function generateApplicationArtifact(
  cwd,
  deployArtifacts,
  arapp, // module
  apm
) {
  // Set appName, path & roles
  let artifact = Object.assign({}, module)

  const appId = namehash.hash(artifact.appName)
  const environments = await getEnvironments(cwd)
  const abi = await getContractAbi(cwd, artifact.path)

  // Analyse contract functions and returns an array
  // > [{ sig: 'transfer(address)', role: 'X_ROLE', notice: 'Transfers..'}]
  const functions = await extract(path.resolve(cwd, arapp.path))
  // extract abi for each function
  // > [{ sig: , role: , notice: , abi: }]
  const functionsWithAbi = decorateFunctionsWithAbi(functions, abi)

  const prevVersions = await apm.getAllVersions(artifact.appName).catch(e => {
    // Catch ENS error on first version
    return []
  })

  // Consult old (major) version's artifacts and return an array
  // of deprecated functions per version
  // > "deprecatedFunctions": { "1.0.0": [{}], "2.0.0": [{}] }
  const deprecatedFunctions = getDeprecatedFunctions(artifact, prevVersions)
  const missingArtifactVersions = getVersionsWithMissingArtifact(prevVersions)

  const artifact = {
    ...module,
    appId,
    environments,
    abi,
    functions: functionsWithAbi,
    deprecatedFunctions,
    deployment: deployArtifacts
      ? { ...deployArtifacts, flattenedCode: `./${SOLIDITY_FILE}` }
      : undefined,
    // Add bytes property to the roles array
    roles: getRoles(arapp.roles),
  }

  return {
    artifact,
    missingArtifactVersions,
  }
}

/**
 * Save artifact
 * @param {Object} artifact
 */
async function writeApplicationArtifact(artifact, outputPath) {
  await writeJson(path.resolve(outputPath, ARTIFACT_FILE), artifact, {
    spaces: '\t',
  })
}

async function generateFlattenedCode(dir, sourcePath) {
  const flattenedCode = await flattenCode([sourcePath])
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
  writeApplicationArtifact,
  generateFlattenedCode,
  sanityCheck,
  copyCurrentApplicationArtifacts,
}
