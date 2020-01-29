import 'source-map-support/register'
import { gray } from 'chalk'
import yargs from 'yargs'
import { toWei } from 'web3-utils'
//
import { configCliMiddleware } from './middleware'
import * as AragonReporter from './reporters/AragonReporter'
import { findProjectRoot } from './util'

const DEFAULT_GAS_PRICE = require('../package.json').aragon.defaultGasPrice

const debugMiddleware = argv => {
  const versionLabel = gray('aragonCLI version:')
  const version = require('../package.json').version
  argv.reporter.debug(versionLabel, version)

  const argvLabel = gray('argv: ')
  argv.reporter.debug(argvLabel)
  argv.reporter.debug(process.argv)
}

const MIDDLEWARES = [debugMiddleware, configCliMiddleware]

// Set up commands
export function init(cb) {
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

    /**
     * OPTIONS
     */
    .option('gas-price', {
      // TODO: Use ethgasprice with inquier promt list
      description: 'Gas price in Gwei',
      default: DEFAULT_GAS_PRICE,
      coerce: gasPrice => {
        return toWei(gasPrice, 'gwei')
      },
    })
    .option('cwd', {
      // TODO: remove once move to power cli
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
    })
    // APM
    .option('ens-registry', {
      description:
        "Address of the ENS registry. This will be overwritten if the selected '--environment' from your arapp.json includes a `registry` property",
    })
    .option('ipfs-rpc', {
      description: 'An URI to the IPFS node used to publish files',
    })
    .option('ipfs-gateway', {
      description: 'An URI to the IPFS Gateway to read files from',
    })
    .group(['ipfs-rpc', 'ipfs-gateway', 'ens-registry'], 'APM:')

  AragonReporter.configure(cli)
  cli.middleware(MIDDLEWARES)

  // Runs if command.handler is successful

  cli.onFinishCommand(() => {
    return cb ? cb() : process.exit()
  })

  // Runs if command.handler throws
  cli.fail((...args) => {
    return cb ? cb(args[1]) : AragonReporter.errorHandler(...args)
  })

  return cli
}
