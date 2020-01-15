import fs from 'fs'
import path from 'path'
import namehash from 'eth-ens-namehash'
import { keccak256 } from 'web3-utils'
import { encodeFunctionSignature } from 'web3-eth-abi'
import { readJsonSync, writeJsonSync, pathExistsSync } from 'fs-extra'
import {
  ARTIFACT_FILE,
  SOLIDITY_FILE,
  ARAPP_FILE,
  MANIFEST_FILE,
  extractContractInfo,
  getApmRepoVersions,
  getFile,
} from '@aragon/toolkit'
//
import { findProjectRoot } from '../../util'
import flattenCode from '../../helpers/flattenCode'

export class MissingFunctionsArtifacts extends Error {}

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

/**
 * Load environments from the arapp file
 * @param {string} cwd CWD
 * @return {Object[]} arapp environments
 */
function getEnvironments(cwd) {
  const arappManifestPath = path.resolve(cwd, ARAPP_FILE)
  const arappManifestFile = readJsonSync(arappManifestPath)
  return arappManifestFile.environments
}

/**
 * Load main contract ABI from the build artifacts
 * @param {string} cwd CWD
 * @param {string} contractPath path to main contract
 * @return {Object[]} ABI
 */
function getContractAbi(cwd, contractPath) {
  const contractInterfacePath = path.resolve(
    cwd,
    'build/contracts',
    path.basename(contractPath, '.sol') + '.json'
  )
  const contractInterface = readJsonSync(contractInterfacePath)
  return contractInterface.abi
}

/**
 * Check if the artifact file exists at a given outputPath
 * @param {string} outputPath Output path
 * @return {boolean} Exists
 */
export function artifactExists(outputPath) {
  const artifactPath = path.resolve(outputPath, ARTIFACT_FILE)
  return pathExistsSync(artifactPath)
}

/**
 * Load the artifact file from a given outputPath
 * @param {string} outputPath Output path
 * @return {Object} old artifact
 */
function getArtifact(outputPath) {
  const artifactPath = path.resolve(outputPath, ARTIFACT_FILE)
  return readJsonSync(artifactPath)
}

/**
 * Check if the flattenCode file exists at a given outputPath
 * @param {string} outputPath Output path
 * @return {boolean} exists
 */
export function flattenCodeFileExists(outputPath) {
  const artifactPath = path.resolve(outputPath, SOLIDITY_FILE)
  return pathExistsSync(artifactPath)
}

/**
 * Change the manifest path's when served from HTTP
 * @param {string} httpServedFrom flag
 * @return {void} -
 */
export function changeManifestForHttpServedFrom(httpServedFrom) {
  const projectRoot = findProjectRoot()
  const manifestOrigin = path.resolve(projectRoot, MANIFEST_FILE)
  const manifestDst = path.resolve(httpServedFrom, MANIFEST_FILE)

  if (!pathExistsSync(manifestDst) && pathExistsSync(manifestOrigin)) {
    const manifest = readJsonSync(manifestOrigin)
    writeJsonSync(manifestDst, {
      ...manifest,
      start_url: path.basename(manifest.start_url),
      script: path.basename(manifest.script),
    })
  }
}

/**
 * Appends the abi of a function to the functions array
 * @param {FunctionInfo[]} functions functions
 * @param {Object[]} abi ABI
 * @return {FunctionInfo[]} functions with appended ABI
 */
function decorateFunctionsWithAbi(functions, abi) {
  const abiFunctions = abi.filter(elem => elem.type === 'function')
  return functions.map(f => ({
    ...f,
    abi: abiFunctions.find(
      functionAbi =>
        encodeFunctionSignature(functionAbi) === encodeFunctionSignature(f.sig)
    ),
  }))
}

/**
 * Compute which versions have missing artifact so the front-end
 * can alert the user that those will be ignored in the
 * next function getDeprecatedFunctions
 * @param {Object[]} prevVersions APM versions
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
 * @param {Object} artifact artifact object
 * @param {Object[]} prevVersions APM versions
 * @return {Object[]} deprecated functions
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
            artifact.functions &&
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
 * Construct artifact object
 *
 * @param {string} web3 web3
 * @param {string} cwd CWD
 * @param {any} deployArtifacts ??
 * @param {ArappConfigFile} arapp Arapp config file
 * @param {Object} apmOptions APM options
 * @return {Object} { artifact, missingArtifactVersions }
 */
export async function generateApplicationArtifact(
  web3,
  cwd,
  deployArtifacts,
  arapp, // module
  apmOptions
) {
  // Set appName, path & roles
  const appId = namehash.hash(arapp.appName)
  const environments = getEnvironments(cwd)
  const abi = getContractAbi(cwd, arapp.path)

  // Analyse contract functions and returns an array
  // > [{ sig: 'transfer(address)', role: 'X_ROLE', notice: 'Transfers..'}]
  const { functions, roles } = await extractContractInfo(
    path.resolve(cwd, arapp.path)
  )
  // extract abi for each function
  // > [{ sig: , role: , notice: , abi: }]
  const functionsWithAbi = decorateFunctionsWithAbi(functions, abi)

  const prevVersions = await getApmRepoVersions(
    web3,
    arapp.appName,
    apmOptions
  ).catch(e => {
    // Catch ENS error on first version
    return []
  })

  // Consult old (major) version's artifacts and return an array
  // of deprecated functions per version
  // > "deprecatedFunctions": { "1.0.0": [{}], "2.0.0": [{}] }
  const deprecatedFunctions = getDeprecatedFunctions(arapp, prevVersions)
  const missingArtifactVersions = getVersionsWithMissingArtifact(prevVersions)

  const artifact = {
    ...arapp,
    appId,
    environments,
    abi,
    functions: functionsWithAbi,
    deprecatedFunctions,
    deployment: deployArtifacts
      ? { ...deployArtifacts, flattenedCode: `./${SOLIDITY_FILE}` }
      : undefined,
    roles,
  }

  return {
    artifact,
    missingArtifactVersions,
  }
}

/**
 * Save artifact
 * @param {Object} artifact Artifact object to write
 * @param {string} outputPath Path to write the artifact to
 * @return {void} -
 */
export function writeApplicationArtifact(artifact, outputPath) {
  writeJsonSync(path.resolve(outputPath, ARTIFACT_FILE), artifact, {
    spaces: '\t',
  })
}

export async function generateFlattenedCode(dir, sourcePath) {
  const flattenedCode = await flattenCode([sourcePath])
  fs.writeFileSync(path.resolve(dir, SOLIDITY_FILE), flattenedCode)
}

/**
 * = Sanity check
 * Makes sure the new artifact components are identical to the currents
 * @param {string} cwd CWD
 * @param {Object[]} newRoles contract roles
 * @param {string} newContractPath path to main contract
 * @param {string|Object} oldArtifactOrOutputPath path to artifact of the artifact
 * @return {boolean} artifact is identical
 */
export function checkIfNewArticatIsIdentical(
  cwd,
  newRoles,
  newContractPath,
  oldArtifactOrOutputPath
) {
  const oldArtifact =
    typeof oldArtifactOrOutputPath === 'string'
      ? getArtifact(oldArtifactOrOutputPath)
      : oldArtifactOrOutputPath

  const { roles, environments, abi, path } = oldArtifact

  const newContractRoles = getRoles(newRoles)
  const newContractEnvironments = getEnvironments(cwd)
  const newContractAbi = getContractAbi(cwd, newContractPath)

  return (
    JSON.stringify(newContractRoles) === JSON.stringify(roles) &&
    JSON.stringify(newContractEnvironments) === JSON.stringify(environments) &&
    JSON.stringify(newContractAbi) === JSON.stringify(abi) &&
    newContractPath === path
  )
}

export async function copyCurrentApplicationArtifacts(
  web3,
  cwd,
  outputPath,
  repo,
  newVersion,
  roles,
  contractPath,
  apmOptions
) {
  const copyingFiles = [ARTIFACT_FILE, SOLIDITY_FILE]
  const { content } = repo
  const uri = `${content.provider}:${content.location}`

  const copyFilesData = await Promise.all(
    copyingFiles.map(async file => {
      try {
        return {
          filePath: path.resolve(outputPath, file),
          fileContent: await getFile(web3, uri, file, apmOptions),
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

  copyFilesData
    .filter(item => item)
    .map(file => {
      if (file.fileName === ARTIFACT_FILE) {
        const currentArtifactIsIdentical = checkIfNewArticatIsIdentical(
          cwd,
          roles,
          contractPath,
          JSON.parse(file.fileContent)
        )
        if (!currentArtifactIsIdentical) {
          throw new Error('Artifact mismatch')
        } else {
          return updateArtifactVersion(file, newVersion)
        }
      }
      return file
    })
    .forEach(({ filePath, fileContent }) =>
      fs.writeFileSync(filePath, fileContent)
    )
}
