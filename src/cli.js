#!/usr/bin/env node
require('babel-polyfill')
const { environmentMiddleware, manifestMiddleware, moduleMiddleware } = require('./middleware')
const { findProjectRoot } = require('./util')
const ConsoleReporter = require('./reporters/ConsoleReporter')

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
cmd.option('ipfs-rpc', {
  description: 'An URI to the IPFS node used to publish files. This will be overwritten if the selected \'--environment\' from your arapp.json includes a `ipfsRPC` property',
  default: 'http://localhost:5001#default'
})
cmd.group('ipfs-rpc', 'APM:')

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
