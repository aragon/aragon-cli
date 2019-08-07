#!/usr/bin/env node

import 'source-map-support/register'
import yargs from 'yargs'
import * as AragonReporter from '@aragon/cli-utils/dist/AragonReporter'
import * as AragonApp from '@aragon/cli-utils/dist/AragonApp'
import * as AragonEnvironment from '@aragon/cli-utils/dist/AragonEnvironment'
//
import * as commands from './commands'
import {
  EXAMPLE,
  EPILOGUE,
  COMMAND_REQUIRED_ERROR,
  HELP_COMMAND_WARNING,
  SCRIPT_NAME,
} from './configuration'

const cli = yargs
  .usage('$0 <command> [options]')
  .scriptName(SCRIPT_NAME)
  .demandCommand(1, COMMAND_REQUIRED_ERROR)
  .showHelpOnFail(false, HELP_COMMAND_WARNING)
  .help()
  .epilogue(EPILOGUE)
  .example(EXAMPLE)
  .strict()
  .alias({
    v: 'version',
    h: 'help',
  })
  .group(['help', 'version'], 'Global options:')
  // the order matters for --help
  .command(commands.install)
  .command(commands.start)
  .command(commands.stop)
  .command(commands.status)
  .command(commands.view)
  .command(commands.propagate)
  .command(commands.uninstall)
  .fail(AragonReporter.errorHandler)

// configure the aragon middleware and their global options
const middlewareOpts = {
  skipOn: ['install', 'start', 'stop', 'status', 'uninstall'],
}

AragonReporter.configure(cli)
AragonApp.configure(cli, middlewareOpts)
AragonEnvironment.configure(cli, middlewareOpts)

// trigger yargs
/* eslint-disable no-unused-expressions */
cli.argv
/* eslint-enable no-unused-expressions */
