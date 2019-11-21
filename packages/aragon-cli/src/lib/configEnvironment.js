const Web3 = require('web3')
const { merge } = require('lodash')

const defaultEnvironments = require('../../config/environments.default')
const defaultNetworks = require('../../config/truffle.default')

const FRAME_ENDPOINT = 'ws://localhost:1248'
const FRAME_ORIGIN = 'aragonCLI'

const ARAGON_RINKEBY_ENDPOINT = 'wss://rinkeby.eth.aragon.network/ws'
const ARAGON_MAINNET_ENDPOINT = 'wss://mainnet.eth.aragon.network/ws'

export class NoEnvironmentInArapp extends Error {}
export class NoEnvironmentInDefaults extends Error {}
export class NoNetworkInTruffleConfig extends Error {}

function getEnv(arapp, environment) {
  if (arapp) {
    if (!environment) environment = 'default'
    const env = arapp.environments[environment]
    if (!env) throw new NoEnvironmentInArapp(environment)
    return env
  }

  // if there is no arapp.json and the command is not init default to the "global" config
  // designed for the dao commands including dao acl
  else {
    if (!environment) environment = 'aragon:local'
    const env = defaultEnvironments[environment]
    if (!env) throw new NoEnvironmentInDefaults(environment)
    return env
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
  return {
    ...truffleNetwork,
    name: network,
    provider: provider
      ? typeof provider === 'function'
        ? provider()
        : provider
      : new Web3.providers.WebsocketProvider(
          host && port ? `ws://${host}:${port}` : `http://localhost:8545`
        ),
  }
}

export function configEnvironment({
  ignoreNetwork,
  useFrame,
  environment,
  network,
  apm,
  arapp,
  truffleConfig = defaultNetworks,
}) {
  const networkOptions = { ignoreNetwork, useFrame }

  if (arapp && !arapp.environments)
    return {
      network: configureNetwork(
        network || 'rpc',
        truffleConfig,
        networkOptions
      ),
    }

  // default environment (no arapp.json) uses different naming
  const env = getEnv(arapp, environment)

  // (Todo): Are these mutations necessary?
  if (arapp) {
    arapp.appName = env.appName
    arapp.env = env
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
    apm: {
      'ens-registry': env.registry,
      ...merge(env.apm || {}, apm || {}),
    },
    // if there is no arapp.json and the command is not init default to the "global" config
    // designed for the dao commands including dao acl
    network: configureNetwork(env.network, truffleConfig, networkOptions),
    wsProvider: wsProviderUrl
      ? new Web3.providers.WebsocketProvider(wsProviderUrl)
      : null,
    arapp,
  }
}
