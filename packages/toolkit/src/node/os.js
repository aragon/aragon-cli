import which from 'which'
import path from 'path'
import fs from 'fs'
//
import { debugLogger } from './misc'

export const getLocalBinary = (binaryName, packageRoot, options = {}) => {
  const { logger = debugLogger } = options

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

export const getGlobalBinary = (binaryName, options = {}) => {
  const { logger = debugLogger } = options

  logger(`Searching binary ${binaryName} in the global PATH variable.`)

  try {
    return which.sync(binaryName)
  } catch {
    return null
  }
}

/**
 * Attempts to find the binary path locally and then globally.
 *
 * @param {string} binaryName e.g.: `ipfs`
 * @param {string} packageRoot
 * @returns {string} the path to the binary, `null` if unsuccessful
 */
export const getBinary = (binaryName, packageRoot, options = {}) => {
  const { logger = debugLogger } = options

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
