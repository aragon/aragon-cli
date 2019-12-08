import 'source-map-support/register'
import yargs from 'yargs'
import * as AragonReporter from './reporters/AragonReporter'
const Web3 = require('web3')

const DEFAULT_GAS_PRICE = require('../package.json').aragon.defaultGasPrice

const { configCliMiddleware } = require('./middleware')
const { findProjectRoot } = require('./util')
const { ens } = require('@aragon/aragen')
const url = require('url')

const debugMiddleware = argv => {
  argv.reporter.debug(
    `aragonCLI version: ${require('../package.json').version}`
  )
  argv.reporter.debug(`argv: ${JSON.stringify(process.argv)}`)
}

const MIDDLEWARES = [debugMiddleware, configCliMiddleware]

// Set up commands
const cli = yargs
  .strict()
  .parserConfiguration({
    'parse-numbers': false,
  })
  .usage(`Usage: aragon <command> [options]`)
  .commandDir('./commands')
  .alias('env', 'environment')
  .alias('h', 'help')
  .alias('v', 'version')
  .epilogue('For more information, check out https://hack.aragon.org')
  .group(['help', 'version'], 'Global options:')
  // blank scriptName so that help text doesn't display "aragon" before each command
  .scriptName('')
  .demandCommand(1, 'You need to specify a command')
  .fail(AragonReporter.errorHandler)
  /**
   * OPTIONS
   */
  .option('gas-price', {
    description: 'Gas price in Gwei',
    default: DEFAULT_GAS_PRICE,
    coerce: gasPrice => {
      return Web3.utils.toWei(gasPrice, 'gwei')
    },
  })
  .option('cwd', {
    description: 'The project working directory',
    default: () => {
      try {
        return findProjectRoot()
      } catch (_) {
        return process.cwd()
      }
    },
  })
  .option('use-frame', {
    description: 'Use frame as a signing provider and web3 provider',
    boolean: true,
    default: false,
  })
  .option('environment', {
    description: 'The environment in your arapp.json that you want to use',
    // default: 'default'
  })
  // APM
  .option('apm.ens-registry', {
    description:
      "Address of the ENS registry. This will be overwritten if the selected '--environment' from your arapp.json includes a `registry` property",
    default: ens,
  })
  .group(['apm.ens-registry'], 'APM:')
  .option('apm.ipfs.rpc', {
    description: 'An URI to the IPFS node used to publish files',
    default: 'http://localhost:5001#default',
  })
  .option('apm.ipfs.gateway', {
    description: 'An URI to the IPFS Gateway to read files from',
    default: 'http://localhost:8080/ipfs',
  })
  .group(['apm.ipfs.rpc', 'apm.ipfs.gateway'], 'APM providers:')
  .option('apm', {
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

AragonReporter.configure(cli)
cli.middleware(MIDDLEWARES)
// trigger yargs
cli.argv // eslint-disable-line no-unused-expressions
