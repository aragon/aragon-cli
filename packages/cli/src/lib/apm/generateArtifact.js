import fs from 'fs'
import path from 'path'
import { keccak256 } from 'web3-utils'
import { readJsonSync, writeJsonSync, pathExistsSync } from 'fs-extra'
import {
  ARTIFACT_FILE,
  SOLIDITY_FILE,
  ARAPP_FILE,
  MANIFEST_FILE,
  apmGetFile,
} from '@aragon/toolkit'
//
import { findProjectRoot } from '../../util'
import flattenCode from '../../helpers/flattenCode'

export class MissingFunctionsArtifacts extends Error {}

const getRoles = (roles) =>
  roles.map((role) => Object.assign(role, { bytes: keccak256(role.id) }))

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
    copyingFiles.map(async (file) => {
      try {
        return {
          filePath: path.resolve(outputPath, file),
          fileContent: await apmGetFile(web3, uri, file, apmOptions),
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
    .filter((item) => item)
    .map((file) => {
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
