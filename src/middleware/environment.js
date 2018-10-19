const Web3 = require('web3')
const url = require('url')
const { ens: defaultEnsRegistry } = require('@aragon/aragen')
const { getTruffleConfig } = require('../helpers/truffle-config')

const configureNetwork = (argv, network) => {
  // Catch commands that dont require network and return
  const skipNetworkSubcommands = new Set(['version']) // 'aragon apm version'
  if (argv.length >= 4) {
    if (skipNetworkSubcommands.has(argv[3])) {
      return {}
    }
  }

  const skipNetworkCommands = new Set(['init', 'devchain', 'ipfs'])

  if (argv.length >= 3) {
    if (skipNetworkCommands.has(argv[2])) {
      return {}
    }
  }

  const truffleConfig = getTruffleConfig()

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

const configureAPM = (ipfsRPC, ensRegistryAddress = defaultEnsRegistry) => {
  const rpc = {}
  if (ipfsRPC) {
    const uri = url.parse(ipfsRPC)
    Object.assign(rpc, {
      protocol: uri.protocol.replace(':', ''),
      host: uri.hostname,
      port: parseInt(uri.port)
    })
    if (uri.hash === '#default') {
      rpc.default = true
    }
  }

  return {
    ensRegistryAddress,
    ipfs: { rpc }
  }
}

// TODO this can be cleaned up once --network is no longer supported
module.exports = function environmentMiddleware (argv) {
  const runsInCwd = argv['_'] === 'init'
  const { reporter, module } = argv
  let { environment, network } = argv

  if (environment && network) {
    reporter.error('Arguments \'--network\' and \'--environment\' are mutually exclusive. Using \'--network\'  has been deprecated and  \'--environment\' should be used instead.')
    process.exit(1)
  }

  if (!runsInCwd && module) {
    if (network && module.environments) {
      reporter.error(
        'Your arapp.json contains an `environments` property. The use of \'--network\' is deprecated and \'--environment\' should be used instead.'
      )
      process.exit(1)
    }
    if (!module.environments) {
      if (environment) {
        reporter.error('Your arapp.json does not contain an `environments` property. The use of \'--environment\'  is not supported.')
        process.exit(1)
      }
      if (!network) network = 'development'
      return {
        apm: configureAPM(argv['ipfs-rpc']),
        network: configureNetwork(argv, network)
      }
    }

    if (!environment) environment = 'default'

    const env = module.environments[environment]

    if (!env) {
      reporter.error(`${environment} environment was not defined in your arapp.json.`)
      process.exit(1)
    }

    // only include the selected environment in the module
    module.environments = {
      [environment]: env
    }

    const resp = {
      module: Object.assign({}, module, { appName: env.appName }),
      apm: configureAPM(env.ipfsRPC || argv['ipfs-rpc'], env.registry),
      network: configureNetwork(argv, env.network)
    }

    return resp
  }
  return {}
}
