import path, { join as joinPath } from 'path'
import { readJson, writeJson } from 'fs-extra'
import getFolderSize from 'get-folder-size'
import { existsSync } from 'fs'
import { homedir } from 'os'
import byteSize from 'byte-size'
import execa from 'execa'
//
import { NO_INSTALLATION_MSG } from './constants'

export const isCorsConfigured = async httpClient => {
  const conf = await httpClient.config.get('API.HTTPHeaders')
  const allowOrigin = CorsAllowAll[0].key.split('.').pop()
  const allowMethods = CorsAllowAll[1].key.split('.').pop()
  if (conf && conf[allowOrigin] && conf[allowMethods]) {
    return true
  } else {
    throw new Error(`Please set the following flags in your IPFS node:
    ${CorsAllowAll.map(({ key, value }) => {
      return `${key}: ${value}`
    }).join('\n    ')}`)
  }
}

export const configureCors = async httpClient => {
  return Promise.all(
    CorsAllowAll.map(({ key, value }) => httpClient.config.set(key, value))
  )
}

const CorsAllowAll = [
  {
    key: 'API.HTTPHeaders.Access-Control-Allow-Origin',
    value: ['*'],
  },
  {
    key: 'API.HTTPHeaders.Access-Control-Allow-Methods',
    value: ['PUT', 'GET', 'POST'],
  },
]

export const ensureRepoInitialized = async (binPath, repoPath) => {
  if (!binPath) {
    throw new Error(NO_INSTALLATION_MSG)
  }

  if (!existsSync(path.resolve(repoPath))) {
    await execa(binPath, ['init'], {
      env: {
        IPFS_PATH: repoPath,
      },
    })
  }
}

export const setPorts = async (repoPath, apiPort, gatewayPort, swarmPort) => {
  await patchRepoConfig(repoPath, {
    Addresses: {
      API: `/ip4/0.0.0.0/tcp/${apiPort}`,
      Announce: [],
      Gateway: `/ip4/0.0.0.0/tcp/${gatewayPort}`,
      NoAnnounce: [],
      Swarm: [`/ip4/0.0.0.0/tcp/${swarmPort}`, `/ip6/::/tcp/${swarmPort}`],
    },
  })
}

export function getDefaultRepoPath() {
  const homedirPath = homedir()
  return joinPath(homedirPath, '.ipfs')
}

export function getPeerIDConfig(repoConfig) {
  return repoConfig.Identity.PeerID
}

export function getPorts(repoConfig) {
  return {
    // default: "/ip4/127.0.0.1/tcp/5001"
    api: repoConfig.Addresses.API.split('/').pop(),
    // default: "/ip4/127.0.0.1/tcp/8080"
    gateway: repoConfig.Addresses.Gateway.split('/').pop(),
    // default: [
    //   "/ip4/0.0.0.0/tcp/4001"
    //   "/ip6/::/tcp/4001"
    // ]
    swarm: repoConfig.Addresses.Swarm[0].split('/').pop(),
  }
}

export async function getRepoVersion(repoPath) {
  const versionFilePath = joinPath(repoPath, 'version')
  const version = await readJson(versionFilePath)
  return version
}

export async function getRepoSize(repoPath) {
  return new Promise((resolve, reject) => {
    getFolderSize(repoPath, (err, size) => {
      if (err) {
        reject(err)
      } else {
        const humanReadableSize = byteSize(size)
        resolve(humanReadableSize)
      }
    })
  })
}

export async function getRepoConfig(repoPath) {
  const configFilePath = joinPath(repoPath, 'config')
  const config = await readJson(configFilePath)
  return config
}

export async function patchRepoConfig(repoPath, patch) {
  const configFilePath = joinPath(repoPath, 'config')
  const repoConfig = await readJson(configFilePath)
  if (!repoConfig) {
    throw new Error(`Cannot read the config file at: ${configFilePath}`)
  }
  const nextConfig = Object.assign(repoConfig, patch)
  await writeJson(configFilePath, nextConfig, { spaces: 2 })
  return nextConfig
}
