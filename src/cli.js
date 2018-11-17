#!/usr/bin/env node
require('@babel/polyfill')
const { environmentMiddleware, manifestMiddleware, moduleMiddleware } = require('./middleware')
const { findProjectRoot } = require('./util')
const ConsoleReporter = require('./reporters/ConsoleReporter')
const url = require('url')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware,
  environmentMiddleware
]

// Set up commands
const cmd = require('yargs')
  .commandDir('./commands', {
    visit: (cmd) => {
      // Add middlewares
      cmd.middlewares = MIDDLEWARES
      return cmd
    }
  }) // .strict()

cmd.alias('h', 'help')
cmd.alias('v', 'version')

// Configure CLI behaviour
cmd.demandCommand(1, 'You need to specify a command')

// Set global options
cmd.option('silent', {
  description: 'Silence output to terminal',
  default: false
})

cmd.option('debug', {
  description: 'Show more output to terminal',
  default: false,
  coerce: (debug) => {
    if (debug || process.env.DEBUG) {
      global.DEBUG_MODE = true
      return true
    }
  }
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

cmd.option('use-frame', {
  description: 'Use frame as a signing provider and web3 provider',
  boolean: true,
  default: false
})

// network coerce is called multiple times, only warn once
let warnedDeprecatedNetwork = false

// Ethereum
cmd.option('network', {
  description: '(deprecated) The network in your truffle.js that you want to use. Deprecated in favor of `--environment`',
  coerce: (network) => {
    if (warnedDeprecatedNetwork) {
      return network
    }
    warnedDeprecatedNetwork = true
    reporter.info('Use of `--network` is deprecated and has been replaced with `--environment`. You may need to update your arapp.json')
  }
})

cmd.option('environment', {
  description: 'The environment in your arapp.json that you want to use'
  // default: 'default'
})

// APM
cmd.option('apm.ens-registry', {
  description: 'Address of the ENS registry. This will be overwritten if the selected \'--environment\' from your arapp.json includes a `registry` property',
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
  process.exit(1)
}).parse(process.argv.slice(2), {
  reporter
})
