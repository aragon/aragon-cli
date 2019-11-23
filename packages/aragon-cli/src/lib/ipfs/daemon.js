import { getBinary, isPortTaken } from '../../util'
import { IPFS_START_TIMEOUT } from './constants'
import { connectOrThrow } from './misc'
import { startProcess } from '../node'

export const startDaemon = (repoPath, options = {}) => {
  const ipfsBinary = getBinary('ipfs')

  if (!ipfsBinary) {
    throw new Error(
      'IPFS is not installed. Use `aragon ipfs install` before proceeding.'
    )
  }

  const processSetup = {
    detached: options.detached,
    cmd: ipfsBinary,
    args: ['daemon', '--migrate'],
    execaOpts: {
      env: {
        IPFS_PATH: repoPath,
      },
    },
    readyOutput: 'Daemon is ready',
    timeout: IPFS_START_TIMEOUT,
  }

  return startProcess(processSetup)
}

/**
 * Check whether the daemon is running by connecting to the API.
 *
 * @param {URL} address a `URL` object
 * @returns {boolean} true if it is running
 */
export async function isDaemonRunning(address) {
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
