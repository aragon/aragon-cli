import path from 'path'
import { copy, ensureDirSync } from 'fs-extra'

/**
 * Copies a prebuild client from aragen
 * @param {string} clientPath Destination client path
 */
export async function copyClient(clientPath) {
  // Get prebuild client from aragen
  const defaultClientFilesPath = path.resolve(
    require.resolve('@aragon/aragen'),
    '../ipfs-cache',
    '@aragon/aragon'
  )

  // Ensure folder exists
  const buildPath = path.join(clientPath, 'build')
  ensureDirSync(buildPath)

  // Copy files
  await copy(defaultClientFilesPath, buildPath)
}
