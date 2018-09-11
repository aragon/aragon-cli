#!/usr/bin/env node
require('babel-polyfill')
const { manifestMiddleware, moduleMiddleware } = require('./middleware')
const { findProjectRoot } = require('./util')
const ConsoleReporter = require('./reporters/ConsoleReporter')
const fs = require('fs')
const Web3 = require('web3')
const { getTruffleConfig, getENSAddress } = require('./helpers/truffle-config')
const url = require('url')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware
]

// Set up commands
const cmd = require('yargs')
  .commandDir('./commands', {
    visit: (cmd) => {
      // Add middlewares
      cmd.middlewares = MIDDLEWARES
      return cmd
    }
  }) //.strict()

cmd.alias('h', 'help')
cmd.alias('v', 'version')

// Configure CLI behaviour
cmd.demandCommand(1, 'You need to specify a command')

// Set global options
cmd.option('silent', {
  description: 'Silence output to terminal',
  default: false
})

cmd.option('cwd', {
  description: 'The project working directory',
  default: () => {
    try {
      return findProjectRoot()
    } catch (_) {
      return process.cwd()
    }
  }
})

/*
  yargs will coerce this function multiple times while executing one command for unknown
  reasons. When a positional optional argument is present, it will go as far as coercing the
  default network, causing a crash in case the default network is not defined, even if explicitely
  specifying another network.

  caching the network also helps performance as we don't need to reinitialize the web3 provider
*/
let cachedNetwork

// Ethereum
cmd.option('network', {
  description: 'The network in your truffle.js that you want to use',
  default: 'development',
  coerce: (network) => {
    if (cachedNetwork) {
      return cachedNetwork
    }

    const skipNetworkCommands = new Set(['init', 'devchain', 'ipfs'])

    if (process.argv.length >= 3) {
      if (skipNetworkCommands.has(process.argv[2])) {
        return {}
      }
    }

    const truffleConfig = getTruffleConfig()

    const truffleNetwork = truffleConfig.networks[network]
    if (!truffleNetwork) {
      throw new Error(`aragon <command> requires a network '${network}' in your truffle.js. For an example, see http://truffleframework.com/docs/advanced/configuration`)
    }
    let provider
    if (truffleNetwork.provider) {
      if (typeof truffleNetwork.provider === 'function') {
        provider = truffleNetwork.provider()
      } else {
        provider = truffleNetwork.provider
      }
    } else if (truffleNetwork.host && truffleNetwork.port) {
      provider = new Web3.providers.WebsocketProvider(`ws://${truffleNetwork.host}:${truffleNetwork.port}`)
    } else {
      provider = new Web3.providers.HttpProvider(`http://localhost:8545`)
    }
    truffleNetwork.provider = provider
    truffleNetwork.name = network

    cachedNetwork = truffleNetwork

    return truffleNetwork   
  }
  // conflicts: 'init'
})

// APM
cmd.option('apm.ens-registry', {
  description: 'Address of the ENS registry',
  default: require('@aragon/aragen').ens
})
cmd.group(['apm.ens-registry', 'eth-rpc'], 'APM:')

cmd.option('apm.ipfs.rpc', {
  description: 'An URI to the IPFS node used to publish files',
  default: 'http://localhost:5001#default'
})
cmd.group('apm.ipfs.rpc', 'APM providers:')

cmd.option('apm', {
  coerce: (apm) => {
    if (apm.ipfs && apm.ipfs.rpc) {
      const uri = url.parse(apm.ipfs.rpc)
      apm.ipfs.rpc = {
        protocol: uri.protocol.replace(':', ''),
        host: uri.hostname,
        port: parseInt(uri.port)
      }
      if (uri.hash === '#default') {
        apm.ipfs.rpc.default = true
      }
    }
    return apm
  }
})

// Add epilogue
cmd.epilogue('For more information, check out https://hack.aragon.one')

// Run
const reporter = new ConsoleReporter()
reporter.debug(JSON.stringify(process.argv))
cmd.fail((msg, err, yargs) => {
  if (!err) yargs.showHelp()
  reporter.error(msg || err.message || 'An error occurred')
  reporter.debug(err && err.stack)
}).parse(process.argv.slice(2), {
  reporter
})
