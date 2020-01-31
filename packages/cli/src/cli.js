import 'source-map-support/register'
import yargs from 'yargs'
//
import { configEnvironmentMiddleware } from './middleware'
import * as AragonReporter from './reporters/AragonReporter'
import { findProjectRoot } from './util'

const debugMiddleware = argv => {
  argv.reporter.debug(
    `aragonCLI version: ${require('../package.json').version}`
  )
  argv.reporter.debug(`argv: ${JSON.stringify(process.argv)}`)
}

const MIDDLEWARES = [debugMiddleware, configEnvironmentMiddleware]

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
