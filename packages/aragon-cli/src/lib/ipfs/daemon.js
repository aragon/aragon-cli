import { getBinary, isPortTaken } from '../../util'
import { connectOrThrow } from './misc'
import { startProcess } from '../node'
import {
  DAEMON_START_TIMEOUT,
  DAEMON_READY_OUTPUT,
  DEFAULT_DAEMON_ARGS,
  NO_INSTALLATION_MSG,
} from './constants'

export const getBinaryPath = () => getBinary('ipfs')

export const startLocalDaemon = (binPath, repoPath, options = {}) => {
  if (!binPath) {
    throw new Error(NO_INSTALLATION_MSG)
  }

  const processSetup = {
    cmd: binPath,
    args: ['daemon', ...DEFAULT_DAEMON_ARGS],
    execaOpts: {
      detached: options.detached,
      env: {
        IPFS_PATH: repoPath,
      },
    },
    readyOutput: DAEMON_READY_OUTPUT,
    timeout: DAEMON_START_TIMEOUT,
  }

  return startProcess(processSetup)
}

/**
 * Check whether the daemon is running by connecting to the API.
 *
 * @param {URL} address a `URL` object
 * @returns {boolean} true if it is running
 */
export async function isLocalDaemonRunning(address) {
  const portTaken = await isPortTaken(address.port)

  if (!portTaken) {
    return false
  }

  try {
    // if port is taken, connect to the API,
    // otherwise we can assume the port is taken by a different process
    await connectOrThrow(address)
    return true
  } catch (e) {
    return false
  }
}
