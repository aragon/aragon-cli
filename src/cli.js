#!/usr/bin/env node
const {
  manifestMiddleware,
  moduleMiddleware
} = require('./middleware')
const {
  findProjectRoot
} = require('./util')
const ConsoleReporter = require('./reporters/ConsoleReporter')
const fs = require('fs')
const Web3 = require('web3')

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
  })

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

// APM
cmd.option('apm.ens-registry', {
  description: 'Address of the ENS registry',
  default: process.env.ENS
})
cmd.group(['apm.ens-registry', 'eth-rpc'], 'APM:')

cmd.option('apm.ipfs.rpc', {
  description: 'An URI to the IPFS node used to publish files',
  default: {
    host: 'ipfs.aragon.network',
    protocol: 'http',
    port: 5001
  }
})
cmd.group('apm.ipfs.rpc', 'APM providers:')

// Ethereum
cmd.option('network', {
  description: 'The network in your truffle.js that you want to use',
  default: 'development',
  coerce: (network) => {
    if (fs.existsSync(`${findProjectRoot()}/truffle.js`)) {
      const truffleConfig = require(`${findProjectRoot()}/truffle.js`)
      let truffleNetwork = truffleConfig.networks[network]
      if (truffleNetwork.provider) {
        provider = truffleNetwork.provider
      } else if (truffleNetwork.host && truffleNetwork.port) {
        provider = new Web3.providers.HttpProvider(`http://${truffleNetwork.host}:${truffleNetwork.port}`)
      } else {
        provider = new Web3.providers.HttpProvider(`http://localhost:8545`)
      }
      truffleNetwork.provider = provider
      return truffleNetwork
    } else {
      throw new Error(`Didn't found any truffle.js file`)
    }
  }
})

cmd.option('keyfile', {
  description: 'Path to a local file containing a private key, rpc node and ENS. If provided it will overwrite eth-rpc (but not apm.ens-registry)',
  default: require('homedir')() + '/.localkey.json',
  coerce: (file) => {
    try {
      return require(require('path').resolve(file))
    } catch (e) {
      return {}
    }
  }
})

// Add epilogue
cmd.epilogue('For more information, check out https://wiki.aragon.one')

// Run
const reporter = new ConsoleReporter()
cmd.fail((msg, err, yargs) => {
  if (!err) yargs.showHelp()
  reporter.error(msg || err.message || 'An error occurred')
  reporter.debug(err && err.stack)
}).parse(process.argv.slice(2), {
  reporter
})
