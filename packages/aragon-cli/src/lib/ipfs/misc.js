import ipfsHttpClient from 'ipfs-http-client' // TODO: import only submodules?
import { join as joinPath } from 'path'
import url from 'url'
import execa from 'execa'
import goplatform from 'go-platform'
//
// import { FETCH_TIMEOUT_ERR, FETCH_TIMEOUT } from '../configuration'

export const getClient = async address => {
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
  //   await startDaemon()
  //   return getClient(address)
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

// function timeout() {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       reject(FETCH_TIMEOUT_ERR)
//     }, FETCH_TIMEOUT)
//   })
// }

export const getGlobalNpmPrefix = async () =>
  (await execa('npm', ['prefix', '--global'])).stdout

export const createTimeout = async (timeout, errorMessage) => {
  setTimeout(() => {
    throw new Error(errorMessage)
  }, timeout)
}

export const getPlatform = () => process.platform
export const getArch = () => process.arch
export const getPlatformForGO = () => goplatform.GOOS
export const getArchForGO = () => goplatform.GOARCH
export const isProject = dir => joinPath(dir, 'package.json')

// https://github.com/ipfs/npm-go-ipfs/blob/master/link-ipfs.js#L8
// https://github.com/ipfs/npm-go-ipfs#publish-a-new-version-of-this-module-with-exact-same-go-ipfs-version
export const cleanVersion = version => version.replace(/-hacky[0-9]+/, '')
export const getDistName = (version, os, arch) =>
  `go-ipfs_v${version}_${os}-${arch}.tar.gz`
