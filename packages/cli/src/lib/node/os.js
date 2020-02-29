import which from 'which'
import path from 'path'
import fs from 'fs'
//
import { debugLogger } from './misc'

/**
 * Get the path of a local NPM binary given its name
 * @param binaryName "npm"
 * @param packageRoot "." | "some/other/dir"
 * @param options
 */
export function getLocalBinary(binaryName, packageRoot, options = {}) {
  const { logger = debugLogger } = options || {}

  // check local node_modules
  let binaryPath = path.join(packageRoot, 'node_modules', '.bin', binaryName)

  logger(`Searching binary ${binaryName} at ${binaryPath}`)
  if (fs.existsSync(binaryPath)) {
    return binaryPath
  }

  // check parent node_modules
  binaryPath = path.join(packageRoot, '..', '.bin', binaryName)

  logger(`Searching binary ${binaryName} at ${binaryPath}.`)
  if (fs.existsSync(binaryPath)) {
    return binaryPath
  }

  // check parent node_modules if this module is scoped (e.g.: @scope/package)
  binaryPath = path.join(packageRoot, '..', '..', '.bin', binaryName)

  logger(`Searching binary ${binaryName} at ${binaryPath}.`)
  if (fs.existsSync(binaryPath)) {
    return binaryPath
  }

  return null
}

/**
 * Get the path of a local NPM binary given its name
 * @param binaryName "npm"
 * @param options
 */
export function getGlobalBinary(binaryName, options = {}) {
  const { logger = debugLogger } = options || {}

  logger(`Searching binary ${binaryName} in the global PATH variable.`)

  try {
    return which.sync(binaryName)
  } catch {
    return null
  }
}

/**
 * Attempts to find the binary path locally and then globally.
 * @param binaryName "npm"
 * @param packageRoot "." | "some/other/dir"
 * @param options
 * @returns the path to the binary, `null` if unsuccessful
 */
export function getBinary(binaryName, packageRoot, options = {}) {
  const { logger = debugLogger } = options || {}

  let binaryPath = getLocalBinary(binaryName, packageRoot, options)

  if (binaryPath === null) {
    binaryPath = getGlobalBinary(binaryName, options)
  }

  if (binaryPath === null) {
    logger(`Cannot find binary ${binaryName}.`)
  } else {
    logger(`Found binary ${binaryName} at ${binaryPath}.`)
  }

  return binaryPath
}
