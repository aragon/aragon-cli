import ipfsHttpClient from 'ipfs-http-client' // TODO: import only submodules?
import url from 'url'
import { exists } from 'fs-extra'
//
import { initPackage, noop } from '../node'
import { ensureRepoInitialized, setPorts, configureCors } from './config'
import { pinArtifacts } from './aragon'
import { startLocalDaemon, isLocalDaemonRunning } from './daemon'
import { installGoIpfs } from './install'

export const ensureLocalDaemon = async ({
  projectPath,
  binPath,
  repoPath,
  apiPort,
  gatewayPort,
  swarmPort,
  logger = noop,
}) => {
  /**
   * Ensure project
   */
  if (await exists(projectPath)) {
    logger(`Project already initialized: ${projectPath}`)
  } else {
    logger(`Project initializing: ${projectPath}`)
    await initPackage(projectPath)
  }

  /**
   * Ensure binaries
   */
  if (await exists(binPath)) {
    logger(`Go-ipfs already installed: ${projectPath}`)
  } else {
    logger(`Go-ipfs installing: ${projectPath}`)
    await installGoIpfs(true, projectPath)
    logger(`Go-ipfs installed: ${projectPath}`)
  }

  /**
   * Ensure daemon running
   */
  const apiAddress = { protocol: 'http', port: apiPort, host: '127.0.0.1' }
  if (await isLocalDaemonRunning(apiAddress)) {
    logger(`Daemon already started on port: ${apiPort}`)
    return
  }

  logger(`Daemon starting on port: ${apiPort}`)
  try {
    await ensureRepoInitialized(binPath, repoPath)
    await setPorts(repoPath, apiPort, gatewayPort, swarmPort)
    const processController = await startLocalDaemon(binPath, repoPath, {
      detached: true,
    })
    processController.detach()
    logger(`Daemon started on port: ${apiPort}`)

    const httpClient = await getHttpClient(`http://localhost:${apiPort}`)
    await configureCors(httpClient)
    await pinArtifacts(httpClient)
    logger('Daemon ready!!')
  } catch (err) {
    logger('Daemon failed to start...')
  }
}

export const getHttpClient = async address => {
  // try {
  return connectOrThrow(address)
  // } catch (err) {
  // if (!address.includes('localhost')) {
  //   throw err
  // }

  // // connecting locally failed
  // const startAndRetry = await askForConfirmation(
  //   'The local IPFS Daemon is not running, do you wish to start it?'
  // )
  // if (startAndRetry) {
  //   await startLocalDaemon()
  //   return getHttpClient(address)
  // }
  // }
}
export async function connectOrThrow(address) {
  try {
    const httpClient = connectThroughHTTP(address)
    await httpClient.version()
    return httpClient
  } catch (err) {
    throw new Error(
      `Could not connect to the IPFS API at ${JSON.stringify(address)}`
    )
  }
}

export function connectThroughHTTP(address) {
  if (typeof address === 'string') {
    return ipfsHttpClient(parseAddressAsURL(address))
  }

  return ipfsHttpClient(address)
}

export function parseAddressAsURL(address) {
  const uri = new url.URL(address)
  return {
    protocol: uri.protocol.replace(':', ''),
    host: uri.hostname,
    port: parseInt(uri.port),
  }
}

// https://github.com/ipfs/npm-go-ipfs/blob/master/link-ipfs.js#L8
// https://github.com/ipfs/npm-go-ipfs#publish-a-new-version-of-this-module-with-exact-same-go-ipfs-version
export const cleanVersion = version => version.replace(/-hacky[0-9]+/, '')
export const getDistName = (version, os, arch) =>
  `go-ipfs_v${version}_${os}-${arch}.tar.gz`
