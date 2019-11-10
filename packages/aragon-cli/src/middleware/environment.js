const Web3 = require('web3')
const url = require('url')
const { getTruffleConfig } = require('../helpers/truffle-config')

const FRAME_ENDPOINT = 'ws://localhost:1248'
const FRAME_ORIGIN = 'aragonCLI'

const ARAGON_RINKEBY_ENDPOINT = 'wss://rinkeby.eth.aragon.network/ws'
const ARAGON_MAINNET_ENDPOINT = 'wss://mainnet.eth.aragon.network/ws'

const configureNetwork = (
  argv,
  network,
  truffleConfig = getTruffleConfig()
) => {
  // Catch commands that dont require network and return
  const skipNetworkCommands = new Set(['devchain', 'ipfs', 'contracts'])

  if (argv._.length >= 1) {
    if (skipNetworkCommands.has(argv._[0])) {
      return {}
    }
  }

  if (argv.useFrame) {
    const providerOptions = {
      headers: {
        origin: FRAME_ORIGIN,
      },
    }
    return {
      name: `frame-${network}`,
      provider: new Web3.providers.WebsocketProvider(
        FRAME_ENDPOINT,
        providerOptions
      ),
    }
  }

  const truffleNetwork = truffleConfig.networks[network]
  if (!truffleNetwork) {
    throw new Error(
      `aragon <command> requires a network '${network}' in your truffle.js. For an example, see http://truffleframework.com/docs/advanced/configuration`
    )
  }
  let provider
  if (truffleNetwork.provider) {
    if (typeof truffleNetwork.provider === 'function') {
      provider = truffleNetwork.provider()
    } else {
      provider = truffleNetwork.provider
    }
  } else if (truffleNetwork.host && truffleNetwork.port) {
    provider = new Web3.providers.WebsocketProvider(
      `ws://${truffleNetwork.host}:${truffleNetwork.port}`
    )
  } else {
    provider = new Web3.providers.HttpProvider(`http://localhost:8545`)
  }
  truffleNetwork.provider = provider
  truffleNetwork.name = network

  return truffleNetwork
}

const configureAPM = (ipfsRPC, gateway, ensRegistryAddress) => {
  const rpc = {}
  if (ipfsRPC) {
    const uri = url.URL(ipfsRPC)
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

module.exports = function environmentMiddleware(argv) {
  const { reporter, module } = argv
  let { environment } = argv

  if (module) {
    if (!environment) environment = 'default'

    const env = module.environments[environment]

    if (!env) {
      reporter.error(
        `${environment} environment was not defined in your arapp.json.`
      )
      process.exit(1)
    }

    // only include the selected environment in the module
    module.environments = {
      [environment]: env,
    }

    module.env = env

    const endPoint =
      env.network === 'rinkeby'
        ? ARAGON_RINKEBY_ENDPOINT
        : env.network === 'mainnet'
        ? ARAGON_MAINNET_ENDPOINT
        : env.wsRPC

    return {
      module: Object.assign({}, module, { appName: env.appName }),
      apm: configureAPM(
        env.apm.ipfs.rpc || argv['ipfs-rpc'],
        env.apm.ipfs.gateway || argv['ipfs-gateway'],
        env.registry || argv['ens-registry']
      ),
      network: configureNetwork(argv, env.network),
      wsProvider: env.wsRPC && new Web3.providers.WebsocketProvider(endPoint),
    }
  }

  // if there is no arapp.json and the command is not init default to the "global" config
  // designed for the dao commands including dao acl
  if (!module) {
    const defaultEnvironments = require('../../config/environments.default')
    const defaultNetworks = require('../../config/truffle.default')

    let { environment } = argv
    const env = defaultEnvironments[environment || 'aragon:local']

    if (environment && !env) {
      reporter.error(
        `Could not find the ${environment} environment. Try using aragon:local, aragon:rinkeby or aragon:mainnet.`
      )
      process.exit(1)
    }

    reporter.debug(
      `Could not find 'arapp.json'. Using the default configuration to connect to ${env.network}.`
    )

    return {
      apm: configureAPM(
        env.apm.ipfs.rpc || argv['ipfs-rpc'],
        env.apm.ipfs.gateway || argv['ipfs-gateway'],
        env.registry || argv['ens-registry']
      ),
      network: configureNetwork(argv, env.network, defaultNetworks),
      wsProvider: env.wsRPC && new Web3.providers.WebsocketProvider(env.wsRPC),
    }
  }

  return {}
}
