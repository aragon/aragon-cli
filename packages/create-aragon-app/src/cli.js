#!/usr/bin/env node
import 'source-map-support/register'
import yargs from 'yargs'
import * as AragonReporter from '@aragon/cli-utils/dist/AragonReporter'

const debugMiddleware = argv => {
  argv.reporter.debug(
    `create-aragon-app version: ${require('../package.json').version}`
  )
  argv.reporter.debug(`argv: ${JSON.stringify(process.argv)}`)
}

// Set up commands
const cli = yargs
  .parserConfiguration({
    'parse-numbers': false,
  })
  .commandDir('./commands')
  // .strict()
  .alias('h', 'help')
  .alias('v', 'version')
  .group(['help', 'version'], 'Global options:')
  .demandCommand(1, 'You need to specify a command')
  .middleware([debugMiddleware])
  .epilogue('For more information, check out https://hack.aragon.org')
  .fail(AragonReporter.errorHandler)

AragonReporter.configure(cli)

// trigger yargs
cli.argv // eslint-disable-line no-unused-expressions
