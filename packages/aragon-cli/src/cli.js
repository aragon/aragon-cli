#!/usr/bin/env node
import 'source-map-support/register'
import yargs from 'yargs'
import * as AragonReporter from '@aragon/cli-utils/dist/AragonReporter'
import * as AragonApp from '@aragon/cli-utils/dist/AragonApp'
import * as AragonEnvironment from '@aragon/cli-utils/dist/AragonEnvironment'
import * as AragonExtensions from './middleware/extensions'
//
import {
  EPILOGUE,
  COMMAND_REQUIRED_ERROR,
  HELP_COMMAND_WARNING,
  SCRIPT_NAME,
} from './configuration'

// Set up commands
const cli = yargs
  .usage('$0 <command> [options]')
  .scriptName(SCRIPT_NAME)
  .demandCommand(1, COMMAND_REQUIRED_ERROR)
  .showHelpOnFail(false, HELP_COMMAND_WARNING)
  .help()
  .epilogue(EPILOGUE)
  .strict()
  // TODO remove??
  .parserConfiguration({
    'parse-numbers': false,
  })
  .alias({
    // v: 'version', TODO Gabi: fix aragen conflict
    h: 'help',
  })
  .group(['help', 'version'], 'Global options:')
  .commandDir('./commands')
  .fail(AragonReporter.errorHandler)

// configure the aragon middleware and their global options
const middlewareOpts = {
  skipOn: ['ipfs'],
}
AragonReporter.configure(cli)
AragonApp.configure(cli, middlewareOpts)
AragonEnvironment.configure(cli, middlewareOpts)
AragonExtensions.configure(cli)
// trigger yargs
/* eslint-disable no-unused-expressions */
cli.argv
/* eslint-enable no-unused-expressions */
