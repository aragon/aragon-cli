import Web3 from 'web3'
import url from 'url'
//
import { getTruffleConfig } from './truffle-config'
import defaultEnvironments from '../../config/environments.default'
import defaultNetworks from '../../config/truffle.default'
import { loadArappFile } from './loadConfigFiles'
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

export class NoEnvironmentInArapp extends Error {}
export class NoEnvironmentInDefaults extends Error {}
export class NoNetworkInTruffleConfig extends Error {}

function getEnv(arapp, env) {
  if (arapp) {
    if (!env) env = 'default'
    const environment = arapp.environments[env]
    if (!environment) throw new NoEnvironmentInArapp(env)
    return environment
  } else {
    // if there is no arapp.json and the command is not init default to the "global" config
    // designed for the dao commands including dao acl
    if (!env) env = 'local'
    const environment = defaultEnvironments[env]
    if (!environment) throw new NoEnvironmentInDefaults(env)
    return environment
  }
}

const configureApm = (ipfsRPC, gateway, ensRegistryAddress) => {
  const rpc = {}
  if (ipfsRPC) {
    const uri = new url.URL(ipfsRPC)
    Object.assign(rpc, {
      protocol: uri.protocol.replace(':', ''),
      host: uri.hostname,
      port: parseInt(uri.port),
    })
    if (uri.hash === '#default') {
      rpc.default = true
    }
  }
  return {
    ensRegistryAddress,
    ipfs: { rpc, gateway },
  }
}

function configureProvider(network, truffleNetwork, useFrame) {
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

  const getProvider = provider => {
    if (provider) {
      if (typeof provider === 'function') return provider()
      else return provider
    } else if (host && port) {
      return new Web3.providers.WebsocketProvider(`ws://${host}:${port}`)
    } else {
      return new Web3.providers.HttpProvider('http://localhost:8545')
    }
  }

  return getProvider(provider)
}

// TODO: Fetch api
// const configureGasPrice = () => {}

// let previousEnvironment
// TODO: Add config environment function

let web3
let prevProvider = {}

export function useEnvironment(env) {
  // try {

  // Parse environment
  const useFrame = RegExp(/frame:(.*)/).test(env)
  env = useFrame ? env.split(/:(.+)/) : env

  // Load config files
  const arapp = loadArappFile()
  const { networks: truffleNetworks } = arapp
    ? getTruffleConfig()
    : defaultNetworks

  // default environment (no arapp.json) uses different naming
  const environment = getEnv(arapp, env)

  const { wsRPC, apm, network, registry, gasPrice } = environment

  const wsProviderUrl =
    wsRPC ||
    (network === 'rinkeby'
      ? ARAGON_RINKEBY_ENDPOINT
      : network === 'mainnet'
      ? ARAGON_MAINNET_ENDPOINT
      : null)

  const ipfsAragonGateway =
    apm && apm.ipfs.gateway // TODO: Refactor apm object
      ? apm.ipfs.gateway
      : network === 'rpc'
      ? IPFS_LOCAL_GATEWAY
      : IPFS_ARAGON_GATEWAY

  const provider = configureProvider(
    network,
    truffleNetworks[network],
    useFrame
  )

  // Context
  if (provider !== prevProvider) {
    prevProvider = provider
    web3 = new Web3(provider)
  }

  return {
    ...environment,
    apmOptions: configureApm(
      IPFS_RPC, // TODO: Check if we need to use Aragon node to publish (ipfs-rpc is An URI to the IPFS node used to publish files)
      ipfsAragonGateway,
      registry || DEVCHAIN_ENS
    ),
    web3,
    wsProvider: wsProviderUrl
      ? new Web3.providers.WebsocketProvider(wsProviderUrl)
      : null,
    gasPrice:
      gasPrice || truffleNetworks[network].gasPrice || DEFAULT_GAS_PRICE,
  }
}
