import execa from 'execa'
import { getBinary, isPortTaken } from '../../util'
import oldIpfsAPI from 'ipfs-api'
import { IPFS_START_TIMEOUT } from './constants'
import { connectOrThrow } from './misc'

let ipfsNode

export const isIPFSRunning = async ipfsRpc => {
  const portTaken = await isPortTaken(ipfsRpc.port)

  if (portTaken) {
    if (!ipfsNode) ipfsNode = oldIpfsAPI(ipfsRpc)

    try {
      // if port is taken, attempt to fetch the node id
      // if this errors, we can assume the port is taken
      // by a process other then the ipfs gateway
      await ipfsNode.id()
      return true
    } catch (e) {
      return false
    }
  }

  return false
}
export const startIPFSDaemon = () => {
  if (!getBinary('ipfs')) {
    throw new Error(
      'IPFS is not installed. Use `aragon ipfs install` before proceeding.'
    )
  }

  let startOutput = ''

  // We add a timeout as starting
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Starting IPFS timed out:\n${startOutput}`))
    }, IPFS_START_TIMEOUT)
  })

  const start = new Promise((resolve, reject) => {
    // await ensureIPFSInitialized()
    const ipfsProc = execa(getBinary('ipfs'), ['daemon', '--migrate'])

    ipfsProc.stdout.on('data', data => {
      startOutput = `${startOutput}${data.toString()}\n`
      if (data.toString().includes('Daemon is ready')) resolve()
    })

    ipfsProc.stderr.on('data', data => {
      reject(new Error(`Starting IPFS failed: ${data.toString()}`))
    })
  })

  return Promise.race([start, timeout])
}

export const startDetachedProcess = async ({
  cmd,
  args,
  execaOpts,
  readyOutput,
}) => {
  return new Promise((resolve, reject) => {
    // start the process
    const subprocess = execa(
      cmd,
      args,
      Object.assign({ detached: true }, execaOpts)
    )

    subprocess.stderr.on('data', data => {
      // parse
      data = data.toString()
      reject(new Error(data))
    })

    subprocess.stdout.on('data', data => {
      // parse
      data = data.toString()
      // check for ready signal
      if (data.includes(readyOutput)) {
        resolve()
        // prevent the parent from waiting on this subprocess
        subprocess.stderr.destroy()
        subprocess.stdout.destroy()
        subprocess.unref()
      }
    })
  })
}

export const startDaemon = async (repoPath, options) => {
  const ipfsBinary = getBinary('ipfs')

  if (!ipfsBinary) {
    throw new Error(
      'IPFS is not installed. Use `aragon ipfs install` before proceeding.'
    )
  }

  await startDetachedProcess({
    cmd: ipfsBinary,
    args: ['daemon', '--migrate'],
    readyOutput: 'Daemon is ready',
  })
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
