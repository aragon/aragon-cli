const Web3 = require('web3')
const { merge } = require('lodash')
const { getTruffleConfig } = require('../helpers/truffle-config')
const HDWalletProvider = require('@truffle/hdwallet-provider')

const defaultEnvironments: EnvironmentsConfig = require('../../config/environments.default')
const defaultNetworks: TruffleConfig = require('../../config/truffle.default')

const FRAME_ENDPOINT = 'ws://localhost:1248'
const FRAME_ORIGIN = 'aragonCLI'

const ARAGON_RINKEBY_ENDPOINT = 'wss://rinkeby.eth.aragon.network/ws'
const ARAGON_MAINNET_ENDPOINT = 'wss://mainnet.eth.aragon.network/ws'

type HDWalletProviderType = typeof HDWalletProvider

interface TruffleConfig {
  networks: {
    [networkName: string]: {
      network_id: number // 15
      host?: string // 'localhost',
      port?: number // 8545,
      provider?: HDWalletProviderType | (() => HDWalletProviderType)
      gas: number // 6.9e6,
      gasPrice: number // 15000000001;
    }
  }
}

interface ApmConfig {
  ipfs: { gateway: string }
}

interface Argv {
  // Options from commands
  _: string[]
  gasPrice: string
  silent: boolean
  debug: boolean
  cwd: string
  useFrame: boolean
  network?: string // The network in your truffle.js that you want to use
  environment?: string // The environment in your arapp.json that you want to use
  apm: ApmConfig
  // Objects injected from other middlewares
  module?: ArappModule
  reporter: any
}

interface EnvironmentsConfig {
  [environmentName: string]: EnvironmentConfig
}

interface EnvironmentConfig {
  registry: string // Registry contract address
  appName?: string // ENS domain of the app
  network: string // Network to use
  wsRPC: string // Node WS URL
  apm?: ApmConfig // "gateway": "https://ipfs.eth.aragon.network/ipfs"
}

interface AragonAppConfigurationFile {
  path?: string // The path to the main contract in your app.
  roles?: {
    // An array of all the roles that your app has.
    id: string // The identifier of the role as it is defined in the contract.
    name: string // A description of the role in the app.
    params: string[] // The names of any parameters for the role.
  }[]
  environments: EnvironmentsConfig // An object containing deploy environment configurations.
}

// Mutations
interface ArappModule extends AragonAppConfigurationFile {
  env?: EnvironmentConfig // Choosen configuration
  appName?: string
}

function getEnv(arapp?: ArappModule, environment?: string): EnvironmentConfig {
  if (arapp) {
    if (!environment) environment = 'default'
    const env = arapp.environments[environment]
    if (!env)
      throw Error(
        `${environment} environment was not defined in your arapp.json.`
      )
    return env
  }

  // if there is no arapp.json and the command is not init default to the "global" config
  // designed for the dao commands including dao acl
  else {
    if (!environment) environment = 'aragon:local'
    const env = defaultEnvironments[environment]
    if (!env)
      throw Error(
        `Could not find the ${environment} environment. Try using aragon:local, aragon:rinkeby or aragon:mainnet.`
      )
    return env
  }
}

function configureNetwork(
  network: string,
  truffleConfig: TruffleConfig,
  options?: { useFrame?: boolean; ignoreNetwork: boolean }
) {
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
    throw new Error(
      `aragon <command> requires a network '${network}' in your truffle.js. For an example, see http://truffleframework.com/docs/advanced/configuration`
    )
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
  arapp,
  ignoreNetwork,
  useFrame,
  environment,
  network,
  apm,
}: {
  arapp?: ArappModule
  ignoreNetwork: boolean
  useFrame: boolean
  isTruffleFwd: boolean
  // Argv options
  environment?: string
  network?: string
  apm: Object
}) {
  const networkOptions = { ignoreNetwork, useFrame }
  const truffleConfig = arapp ? getTruffleConfig() : defaultNetworks

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
