import 'source-map-support/register'
import yargs from 'yargs'
//
import * as AragonReporter from './reporters/AragonReporter'

const debugMiddleware = argv => {
  argv.reporter.debug(
    `create-aragon-app version: ${require('../package.json').version}`
  )
  argv.reporter.debug(`argv: ${JSON.stringify(process.argv)}`)
}

// Set up commands
const cli = yargs
  .scriptName('create-aragon-app')
  .parserConfiguration({
    'parse-numbers': false,
  })
  .commandDir('./commands')
  // .strict()
  .alias('h', 'help')
  .alias('v', 'version')
  .group(['help', 'version'], 'Global options:')
  .demandCommand(1, 'You need to specify a command')
  .epilogue('For more information, check out https://hack.aragon.org')
  .fail(AragonReporter.errorHandler)

AragonReporter.configure(cli)
cli.middleware([debugMiddleware])

// trigger yargs
cli.argv // eslint-disable-line no-unused-expressions
