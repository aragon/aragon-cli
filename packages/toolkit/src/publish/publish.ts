import path from 'path'
import fs from 'fs'
//
import { AragonManifest, AragonAppJson, AragonArtifact } from './types'
import findMissingManifestFiles from './findMissingManifestFiles'
import getAragonArtifact from './getAragonArtifact'
import uploadReleaseToIpfs from './uploadDistToIpfs'
import matchContractRoles from './matchContractRoles'
import parseContractFunctions from '../utils/parseContractFunctions'
import flattenSolidity from '../utils/flattenSolidity'
import readArtifacts from './readArtifacts'
import {
  MANIFEST_FILE,
  ARTIFACT_FILE,
  ARAPP_FILE,
  SOLIDITY_FILE,
} from '../helpers/constants'

export class ReleaseValidationError extends Error {}

const artifactName: string = ARTIFACT_FILE
const manifestName: string = MANIFEST_FILE
const arappName: string = ARAPP_FILE
const flatCodeName: string = SOLIDITY_FILE

const readFile = (filepath: string): string => fs.readFileSync(filepath, 'utf8')
const readJson = <T>(filepath: string): T =>
  JSON.parse(fs.readFileSync(filepath, 'utf8'))
const writeJson = <T>(filepath: string, data: T) =>
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2))

/**
 * Publish requires eventually to publish a new APM version with
 * - contractAddress
 * - contentURI
 *
 * Build app source code to have a working front-end with two entrypoints
 * 1) index.html
 * 2) script.js
 *
 * buidler can provide the artifacts in ./artifacts/Main.json
 * buidler can return a string of flattened code internally
 *
 * Have necessary metadata available
 * 1) manifest.json. Points to files that must be available
 *   - findMissingManifestFiles
 * 2) artifact.json
 */
export async function publishRelease(
  distPath: string,
  options?: {
    rootPath?: string
    ignorePatterns?: string
    progress?: (totalBytes: number) => void
    skipValidation?: boolean
    artifactsDir?: string
    sourceCode?: string
  }
) {
  const { rootPath = '.', sourceCode } = options || {}
  // Already done: Contract compilation
  // Already done: App building

  // Generate artifact.json, copy manifest.json and code.sol
  const arapp = readJson<AragonAppJson>(path.join(rootPath, arappName))
  const manifest = readJson<AragonManifest>(path.join(rootPath, manifestName))
  const flatCode = sourceCode || (await flattenSolidity(arapp.path))
  const abi = readArtifacts(arapp.path, options)

  const functions = parseContractFunctions(flatCode, arapp.path)
  const artifact = getAragonArtifact(arapp, functions, abi)

  writeJson(path.join(distPath, artifactName), artifact)
  writeJson(path.join(distPath, manifestName), manifest)
  fs.writeFileSync(path.join(distPath, flatCodeName), flatCode)

  // Validate release files
  if (!(options || {}).skipValidation) {
    validateRelease(distPath)
  }

  // Upload dist to IPFS
  const contentHash = await uploadReleaseToIpfs(distPath, options)

  // Generate publish transaction data
}

/**
 *
 */
function validateRelease(distPath: string) {
  // Load files straight from the dist directory
  const artifact = readJson<AragonArtifact>(path.join(distPath, artifactName))
  const manifest = readJson<AragonManifest>(path.join(distPath, manifestName))
  const flatCode = readFile(path.join(distPath, flatCodeName))
  const functions = parseContractFunctions(flatCode, artifact.path)

  // Make sure all declared files in the manifest are there
  const missingFiles = findMissingManifestFiles(manifest, distPath)
  if (missingFiles.length)
    throw new ReleaseValidationError(
      `
Some files declared in manifest.json are not found in dist dir: ${distPath}
${missingFiles.map(file => ` - ${file.id}: ${file.path}`).join('\n')}
      
Make sure your app build process includes them in the dist directory on
every run of the designated NPM build script
`
    )

  // Make sure that the roles in the contract match the ones in arapp.json
  const roleMatchErrors = matchContractRoles(functions, artifact.roles)
  if (roleMatchErrors.length)
    throw new ReleaseValidationError(
      `
Some contract roles do not match declared roles in ${arappName}:
${roleMatchErrors.map(err => ` - ${err.id}: ${err.message}`).join('\n')}
`
    )
}
