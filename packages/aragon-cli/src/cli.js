#!/usr/bin/env node
import 'source-map-support/register'
const Web3 = require('web3')

const DEFAULT_GAS_PRICE = require('../package.json').aragon.defaultGasPrice

const { configCliMiddleware } = require('./middleware')
const { findProjectRoot } = require('./util')
const { ens } = require('@aragon/aragen')
const ConsoleReporter = require('@aragon/cli-utils/src/reporters/ConsoleReporter')
const url = require('url')

const reporter = new ConsoleReporter()

const debugMiddleware = argv => {
  if (argv.debug || process.env.DEBUG) {
    global.DEBUG_MODE = true
    reporter.debug(`aragonCLI version: ${require('../package.json').version}`)
    reporter.debug(`argv: ${JSON.stringify(process.argv)}`)
  }
}

const MIDDLEWARES = [debugMiddleware, configCliMiddleware]

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
  coerce: debug => debug || process.env.DEBUG,
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

// network coerce is called multiple times, only warn once
let warnedDeprecatedNetwork = false

// Ethereum
cmd.option('network', {
  description:
    '(deprecated) The network in your truffle.js that you want to use. Deprecated in favor of `--environment`',
  coerce: network => {
    if (warnedDeprecatedNetwork) {
      return network
    }
    warnedDeprecatedNetwork = true
    reporter.info(
      'Use of `--network` is deprecated and has been replaced with `--environment`. You may need to update your arapp.json'
    )
  },
})

cmd.option('environment', {
  description: 'The environment in your arapp.json that you want to use',
  // default: 'default'
})

// APM
cmd.option('apm.ens-registry', {
  description:
    "Address of the ENS registry. This will be overwritten if the selected '--environment' from your arapp.json includes a `registry` property",
  default: ens,
})
cmd.group(['apm.ens-registry'], 'APM:')

cmd.option('apm.ipfs.rpc', {
  description: 'An URI to the IPFS node used to publish files',
  default: 'http://localhost:5001#default',
})
cmd.option('apm.ipfs.gateway', {
  description: 'An URI to the IPFS Gateway to read files from',
  default: 'http://localhost:8080/ipfs',
})
cmd.group(['apm.ipfs.rpc', 'apm.ipfs.gateway'], 'APM providers:')

cmd.option('apm', {
  coerce: apm => {
    if (apm.ipfs && apm.ipfs.rpc) {
      const uri = new url.URL(apm.ipfs.rpc)
      apm.ipfs.rpc = {
        protocol: uri.protocol.replace(':', ''),
        host: uri.hostname,
        port: parseInt(uri.port),
      }
      if (uri.hash === '#default') {
        apm.ipfs.rpc.default = true
      }
    }
    return apm
  },
})

// Add epilogue
cmd.epilogue('For more information, check out https://hack.aragon.org')

cmd.group(['help', 'version', 'silent', 'debug'], 'Global options:')

// Run
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
