import url from 'url'
import { ethers } from 'ethers'

import { defaultEnvironments } from './config'
import { loadArappFile } from './utils/loadConfigFiles'
import {
  FRAME_ENDPOINT,
  FRAME_ORIGIN,
  ARAGON_RINKEBY_ENDPOINT,
  ARAGON_MAINNET_ENDPOINT,
  XDAI_ENDPOINT,
  IPFS_RPC,
  IPFS_LOCAL_GATEWAY,
  IPFS_ARAGON_GATEWAY,
} from './constants'
import { AragonAppJson, AragonEnvironment } from './types'

export class NoEnvironmentInArapp extends Error {}
export class NoEnvironmentInDefaults extends Error {}
export class NoNetworkInTruffleConfig extends Error {}

const frameHeaders: { [key: string]: string } = { origin: FRAME_ORIGIN }

function getEnvironment(
  envName: string,
  arapp?: AragonAppJson
): AragonEnvironment {
  if (!envName) envName = 'rinkeby'

  let environment
  if (arapp) {
    environment = arapp.environments[envName]
  } else {
    // if there is no arapp.json and the command is not init default to the "global" config
    // designed for the dao commands including dao acl
    environment = defaultEnvironments[envName]
  }
  if (!environment) throw new NoEnvironmentInDefaults(envName)
  return environment
}

interface ApmOptions {
  ensRegistryAddress: string
  ipfs: {
    rpc: {
      protocol: string
      host: string
      port: number
      default?: boolean
    }
    gateway: string
  }
}

function configureApm(
  ipfsRpcUrl: string,
  gatewayUrl: string,
  ensRegistryAddress: string
): ApmOptions {
  if (ipfsRpcUrl) {
    const uri = new url.URL(ipfsRpcUrl)
    return {
      ensRegistryAddress,
      ipfs: {
        rpc: {
          protocol: uri.protocol.replace(':', ''),
          host: uri.hostname,
          port: parseInt(uri.port),
          default: uri.hash === '#default',
        },
        gateway: gatewayUrl,
      },
    }
  } else {
    return {
      ensRegistryAddress,
      ipfs: {
        rpc: {
          protocol: '',
          host: '',
          port: 0,
        },
        gateway: gatewayUrl,
      },
    }
  }
}

function configureEthersProvider({
  useFrame,
  ensAddress,
  wsProviderUrl,
}: {
  useFrame: boolean
  ensAddress?: string
  wsProviderUrl: string
}): ethers.providers.Provider {
  const networkOptions = ensAddress
    ? { name: '', chainId: 0, ensAddress }
    : undefined

  if (useFrame) {
    const connectionOptions = {
      url: FRAME_ENDPOINT,
      headers: frameHeaders,
    }
    return new ethers.providers.JsonRpcProvider(
      connectionOptions,
      networkOptions
    )
  } else {
    return new ethers.providers.JsonRpcProvider(wsProviderUrl, networkOptions)
  }
}

// let previousEnvironment
// TODO: Add config environment function

interface UseEnvironment extends AragonEnvironment {
  apmOptions: ApmOptions
  chainId: number
  provider: ethers.providers.Provider
}

export function useEnvironment(env: string): UseEnvironment {
  // Parse environment
  const useFrame = RegExp(/frame:(.*)/).test(env)
  env = useFrame ? env.split(/:(.+)/)[1] || env : env

  // Load config files
  const arapp = loadArappFile()

  // default environment (no arapp.json) uses different naming
  const environment = getEnvironment(env, arapp)

  const { wsRPC, network, registry } = environment

  const wsProviderUrl =
    wsRPC ||
    (network === 'rinkeby'
      ? ARAGON_RINKEBY_ENDPOINT
      : network === 'xdai'
      ? XDAI_ENDPOINT
      : ARAGON_MAINNET_ENDPOINT)

  const chainId = network === 'rinkeby' ? 4 : network === 'xdai' ? 100 : 1

  const ipfsAragonGateway =
    network === 'rpc' ? IPFS_LOCAL_GATEWAY : IPFS_ARAGON_GATEWAY

  const ensAddress = registry

  return {
    ...environment,
    apmOptions: configureApm(
      IPFS_RPC, // TODO: Check if we need to use Aragon node to publish (ipfs-rpc is An URI to the IPFS node used to publish files)
      ipfsAragonGateway,
      ensAddress
    ),
    provider: configureEthersProvider({
      useFrame,
      ensAddress,
      wsProviderUrl,
    }),
    chainId,
  }
}
