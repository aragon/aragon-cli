import Web3 from 'web3'
import url from 'url'
import { ethers } from 'ethers'
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

const frameHeaders: { [key: string]: string } = { origin: FRAME_ORIGIN }

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

function configureEthersProvider({
  host,
  port,
  useFrame,
  ensAddress,
}: {
  host: string
  port: number
  useFrame: boolean
  ensAddress?: string
}): ethers.providers.Provider {
  const connectionOptions = {
    url: useFrame
      ? FRAME_ENDPOINT
      : host && port
      ? `http://${host}:${port}`
      : 'http://localhost:8545',
    headers: useFrame ? frameHeaders : undefined,
  }
  const networkOptions = ensAddress
    ? { name: '', chainId: 0, ensAddress }
    : undefined
  return new ethers.providers.JsonRpcProvider(connectionOptions, networkOptions)
}

// TODO: Fetch api
// const configureGasPrice = () => {}

// let previousEnvironment
// TODO: Add config environment function

interface UseEnvironment extends AragonEnvironment {
  apmOptions: ApmOptions
  web3: Web3
  wsProvider?: WebsocketProvider
  gasPrice: string
  provider: ethers.providers.Provider
}

export function useEnvironment(env: string): UseEnvironment {
  // Parse environment
  const useFrame = RegExp(/frame:(.*)/).test(env)
  env = useFrame ? env.split(/:(.+)/)[1] || env : env

  // Load config files
  const arapp = loadArappFile()
  const { networks: truffleNetworks } = getTruffleConfig() || defaultNetworks

  // default environment (no arapp.json) uses different naming
  const environment = getEnvironment(env, arapp)

  const { wsRPC, network, registry } = environment

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
  const ensAddress = registry || DEVCHAIN_ENS

  const truffleNetwork = truffleNetworks[network]
  if (!useFrame && !truffleNetwork) {
    throw new NoNetworkInTruffleConfig(network)
  }

  return {
    ...environment,
    apmOptions: configureApm(
      IPFS_RPC, // TODO: Check if we need to use Aragon node to publish (ipfs-rpc is An URI to the IPFS node used to publish files)
      ipfsAragonGateway,
      ensAddress
    ),
    // Todo: Consolidate provider initialization
    web3: new Web3(configureProvider(network, truffleNetwork, useFrame)),
    provider: configureEthersProvider({
      host: truffleNetwork.host,
      port: truffleNetwork.port,
      useFrame,
      ensAddress,
    }),
    wsProvider: wsProviderUrl
      ? new Web3.providers.WebsocketProvider(wsProviderUrl)
      : undefined,
    gasPrice: truffleNetworks[network].gasPrice || DEFAULT_GAS_PRICE,
  }
}
