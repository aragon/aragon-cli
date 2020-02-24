import Web3 from 'web3'
import url from 'url'
//
import { defaultEnvironments, defaultNetworks } from '../config'
import { loadArappFile, getTruffleConfig } from './loadConfigFiles'
import {
  DEFAULT_GAS_PRICE,
  FRAME_ENDPOINT,
  FRAME_ORIGIN,
  ARAGON_RINKEBY_ENDPOINT,
  ARAGON_MAINNET_ENDPOINT,
  IPFS_RPC,
  IPFS_LOCAL_GATEWAY,
  IPFS_ARAGON_GATEWAY,
  DEVCHAIN_ENS,
} from './constants'
import { AragonAppJson, AragonEnvironment } from '../types'
import { WebsocketProvider, HttpProvider } from 'web3-core'

export class NoEnvironmentInArapp extends Error {}
export class NoEnvironmentInDefaults extends Error {}
export class NoNetworkInTruffleConfig extends Error {}

function getEnvironment(
  envName: string,
  arapp?: AragonAppJson
): AragonEnvironment {
  if (arapp) {
    if (!envName) envName = 'default'
    const environment = arapp.environments[envName]
    if (!environment) throw new NoEnvironmentInArapp(envName)
    return environment
  } else {
    // if there is no arapp.json and the command is not init default to the "global" config
    // designed for the dao commands including dao acl
    if (!envName) envName = 'local'
    const environment = defaultEnvironments[envName]
    if (!environment) throw new NoEnvironmentInDefaults(envName)
    return environment
  }
}

function configureApm(
  ipfsRpcUrl: string,
  gatewayUrl: string,
  ensRegistryAddress: string
): {
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
} {
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

function configureProvider(
  network: string,
  truffleNetwork: {
    provider: any
    host: string
    port: number
  },
  useFrame: boolean
): any | WebsocketProvider | HttpProvider {
  if (useFrame) {
    return new Web3.providers.WebsocketProvider(
      FRAME_ENDPOINT,
      { headers: { origin: FRAME_ORIGIN } } // Provider options
    )
  }

  if (!truffleNetwork) {
    throw new NoNetworkInTruffleConfig(network)
  }

  const { provider, host, port } = truffleNetwork

  if (provider) {
    if (typeof provider === 'function') return provider()
    else return provider
  } else if (host && port) {
    return new Web3.providers.WebsocketProvider(`ws://${host}:${port}`)
  } else {
    return new Web3.providers.HttpProvider('http://localhost:8545')
  }
}

// TODO: Fetch api
// const configureGasPrice = () => {}

// let previousEnvironment
// TODO: Add config environment function

interface UseEnvironment extends AragonEnvironment {
  apmOptions: any
  web3: Web3
  wsProvider?: WebsocketProvider
  gasPrice: string
}

export function useEnvironment(env: string): UseEnvironment {
  // try {

  // Parse environment
  const useFrame = RegExp(/frame:(.*)/).test(env)
  env = useFrame ? env.split(/:(.+)/)[1] || env : env

  // Load config files
  const arapp = loadArappFile()
  const { networks: truffleNetworks } = arapp
    ? getTruffleConfig()
    : defaultNetworks

  // default environment (no arapp.json) uses different naming
  const environment = getEnvironment(env, arapp)

  const { wsRPC, /* apm, */ network, registry, gasPrice } = environment

  const wsProviderUrl =
    wsRPC ||
    (network === 'rinkeby'
      ? ARAGON_RINKEBY_ENDPOINT
      : network === 'mainnet'
      ? ARAGON_MAINNET_ENDPOINT
      : null)

  // NOTE: environment.apm does NOT exist
  // const ipfsAragonGateway =
  //   apm && apm.ipfs.gateway // TODO: Refactor apm object
  //     ? apm.ipfs.gateway
  //     : network === 'rpc'
  //     ? IPFS_LOCAL_GATEWAY
  //     : IPFS_ARAGON_GATEWAY
  const ipfsAragonGateway =
    network === 'rpc' ? IPFS_LOCAL_GATEWAY : IPFS_ARAGON_GATEWAY

  const provider = configureProvider(
    network,
    truffleNetworks[network],
    useFrame
  )

  return {
    ...environment,
    apmOptions: configureApm(
      IPFS_RPC, // TODO: Check if we need to use Aragon node to publish (ipfs-rpc is An URI to the IPFS node used to publish files)
      ipfsAragonGateway,
      registry || DEVCHAIN_ENS
    ),
    web3: new Web3(provider),
    wsProvider: wsProviderUrl
      ? new Web3.providers.WebsocketProvider(wsProviderUrl)
      : undefined,
    gasPrice:
      gasPrice || truffleNetworks[network].gasPrice || DEFAULT_GAS_PRICE,
  }
}
