#!/usr/bin/env node
const {
  examplesDecorator,
  middlewaresDecorator
} = require('./decorators')
const {
  manifestMiddleware,
  moduleMiddleware
} = require('./middleware')
const {
  findProjectRoot
} = require('./util')
const ConsoleReporter = require('./reporters/ConsoleReporter')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware
]

const DECORATORS = [
  examplesDecorator,
  middlewaresDecorator(MIDDLEWARES)
]

// Set up commands
const cmd = require('yargs')
  .commandDir('./commands', {
    visit: (cmd) => {
      // Decorates the command with new aspects (does not touch `argv`)
      cmd = DECORATORS.reduce(
        (innerCmd, decorator) => decorator(innerCmd),
        cmd
      )

      return cmd
    }
  })

// Configure CLI behaviour
cmd.demandCommand()

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
cmd.option('eth-rpc', {
  description: 'An URI to the Ethereum node used for RPC calls',
  default: 'http://localhost:8545'
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
cmd.fail((msg, err, a) => {
  reporter.error(err.message || msg || 'An error occurred')
  reporter.debug(err.stack)
  process.exit(1)
}).parse(process.argv.slice(2), {
  reporter
})
