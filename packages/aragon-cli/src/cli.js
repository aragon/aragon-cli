#!/usr/bin/env node
import 'core-js/stable'
import 'regenerator-runtime/runtime'
require('source-map-support/register')
const Web3 = require('web3')

const DEFAULT_GAS_PRICE = require('../package.json').aragon.defaultGasPrice

const {
  environmentMiddleware,
  manifestMiddleware,
  moduleMiddleware,
} = require('./middleware')
const { findProjectRoot } = require('./util')
const ConsoleReporter = require('@aragon/cli-utils/src/reporters/ConsoleReporter')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware,
  environmentMiddleware,
]

// Set up commands
const cmd = require('yargs')
  .strict()
  .parserConfiguration({
    'parse-numbers': false,
  })
  .usage(`Usage: aragon <command> [options]`)
  .commandDir('./commands')

cmd.middleware(MIDDLEWARES)

cmd.alias('env', 'environment')
cmd.alias('h', 'help')
cmd.alias('v', 'version')

// blank scriptName so that help text doesn't display "aragon" before each command
cmd.scriptName('')

// Configure CLI behaviour
cmd.demandCommand(1, 'You need to specify a command')

// Set global options
cmd.option('silent', {
  description: 'Silence output to terminal',
  boolean: true,
  default: false,
})

cmd.option('debug', {
  description: 'Show more output to terminal',
  boolean: true,
  default: false,
  coerce: debug => {
    if (debug || process.env.DEBUG) {
      global.DEBUG_MODE = true
      return true
    }
  },
})

cmd.option('gas-price', {
  description: 'Gas price in Gwei',
  default: DEFAULT_GAS_PRICE,
  coerce: gasPrice => {
    return Web3.utils.toWei(gasPrice, 'gwei')
  },
})

cmd.option('cwd', {
  description: 'The project working directory',
  default: () => {
    try {
      return findProjectRoot()
    } catch (_) {
      return process.cwd()
    }
  },
})

cmd.option('use-frame', {
  description: 'Use frame as a signing provider and web3 provider',
  boolean: true,
  default: false,
})

cmd.option('environment', {
  description: 'The environment in your arapp.json that you want to use',
  // default: 'default'
})

// APM
cmd.option('ipfs-rpc', {
  description: 'An URI to the IPFS node used to publish files',
  default: 'http://localhost:5001#default',
})
cmd.option('ipfs-gateway', {
  description: 'An URI to the IPFS Gateway to read files from',
  default: 'http://localhost:8080/ipfs',
})
cmd.group(['ipfs-rpc', 'ipfs-gateway'], 'APM:')

// Add epilogue
cmd.epilogue('For more information, check out https://hack.aragon.org')

// Run
const reporter = new ConsoleReporter()
reporter.debug(JSON.stringify(process.argv)) // TODO: this ain't working (DEBUG_MODE not set yet?)
cmd
  .fail((msg, err, yargs) => {
    reporter.error(msg || err.message || 'An error occurred')

    if (!err) {
      yargs.showHelp()
    } else if (err.stack) {
      reporter.debug(err.stack)
    }

    process.exit(1)
  })
  .parse(process.argv.slice(2), {
    reporter,
  })
