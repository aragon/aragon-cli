import Web3 from 'web3'
import url from 'url'
//
import defaultEnvironments from '../../../config/environments.default'
import defaultNetworks from '../../../config/truffle.default'
import { DEVCHAIN_ENS } from '../../commands/devchain_cmds/utils/constants'

const FRAME_ENDPOINT = 'ws://localhost:1248'
const FRAME_ORIGIN = 'aragonCLI'

const ARAGON_RINKEBY_ENDPOINT = 'wss://rinkeby.eth.aragon.network/ws'
const ARAGON_MAINNET_ENDPOINT = 'wss://mainnet.eth.aragon.network/ws'

const IPFS_RPC = 'http://localhost:5001#default'
const IPFS_GATEWAY = 'http://localhost:8080/ipfs'

export class NoEnvironmentInArapp extends Error {}
export class NoEnvironmentInDefaults extends Error {}
export class NoNetworkInTruffleConfig extends Error {}

function getEnv(arapp, environment) {
  if (arapp) {
    if (!environment) environment = 'default'
    const env = arapp.environments[environment]
    if (!env) throw new NoEnvironmentInArapp(environment)
    return env
  } else {
    // if there is no arapp.json and the command is not init default to the "global" config
    // designed for the dao commands including dao acl
    if (!environment) environment = 'aragon:local'
    const env = defaultEnvironments[environment]
    if (!env) throw new NoEnvironmentInDefaults(environment)
    return env
  }
}

const configureAPM = (ipfsRPC, gateway, ensRegistryAddress) => {
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

function configureNetwork(network, truffleConfig, options) {
  const { useFrame, ignoreNetwork } = options || {}

  if (ignoreNetwork) return {}

  if (useFrame) {
    return {
      name: `frame-${network}`,
      provider: new Web3.providers.WebsocketProvider(
        FRAME_ENDPOINT,
        { headers: { origin: FRAME_ORIGIN } } // Provider options
      ),
    }
  }

  const truffleNetwork = truffleConfig.networks[network]
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

  return {
    ...truffleNetwork,
    name: network,
    provider: getProvider(provider),
  }
}

export function configEnvironment({
  ignoreNetwork,
  useFrame,
  environment,
  wsRpc,
  ensRegistry,
  ipfsRpc,
  ipfsGateway,
  arapp,
  truffleConfig = defaultNetworks,
}) {
  const networkOptions = { ignoreNetwork, useFrame }

  // default environment (no arapp.json) uses different naming
  const env = getEnv(arapp, environment)

  // (Todo): Are these mutations necessary?
  if (arapp) {
    arapp.appName = env.appName
    arapp.environments = { [environment || 'default']: env } // only include the selected environment in the module
  }

  const wsProviderUrl = env.wsRPC
    ? env.wsRPC
    : env.network === 'rinkeby'
    ? ARAGON_RINKEBY_ENDPOINT
    : env.network === 'mainnet'
    ? ARAGON_MAINNET_ENDPOINT
    : null

  return {
    apm: configureAPM(
      ipfsRpc || IPFS_RPC,
      ipfsGateway || (env.apm && env.apm.ipfs.gateway) || IPFS_GATEWAY,
      ensRegistry || env.registry || DEVCHAIN_ENS
    ),
    network: configureNetwork(env.network, truffleConfig, networkOptions),
    wsProvider: wsProviderUrl
      ? new Web3.providers.WebsocketProvider(wsRpc || wsProviderUrl)
      : null,
    arapp,
  }
}
