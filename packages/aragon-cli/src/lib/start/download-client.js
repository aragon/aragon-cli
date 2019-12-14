import os from 'os'
import path from 'path'
import { existsSync, ensureDirSync } from 'fs-extra'
import { promisify } from 'util'
const clone = promisify(require('git-clone'))
//
const pkg = require('../../../package.json')

/**
 * Computes client path
 * @param {string} clientVersion "1.0.0"
 * @return {string} client path
 */
export function getClientPath(clientVersion) {
  return `${os.homedir()}/.aragon/client-${clientVersion}`
}

/**
 * Checks if path exists
 * @param {string} clientPath
 * @return {boolean}
 */
export function existsClientPath(clientPath) {
  return existsSync(path.resolve(clientPath))
}

/**
 * Git clone repo
 * @param {*} param0
 * @return {Promise<void>}
 */
export async function downloadClient({
  clientPath,
  clientRepo = pkg.aragon.clientRepo,
  clientVersion,
}) {
  ensureDirSync(clientPath)
  return clone(clientRepo, clientPath, { checkout: clientVersion })
}
