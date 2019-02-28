#!/usr/bin/env node
require('@babel/polyfill')
const ConsoleReporter = require('./reporters/ConsoleReporter')

// Set up commands
const cmd = require('yargs').commandDir('./commands', {
  visit: cmd => {
    return cmd
  },
}) // .strict()

cmd.alias('h', 'help')
cmd.alias('v', 'version')

// Configure CLI behaviour
cmd.demandCommand(1, 'You need to specify a command')

// Set global options
cmd.option('silent', {
  description: 'Silence output to terminal',
  default: false,
})

cmd.option('debug', {
  description: 'Show more output to terminal',
  default: false,
  coerce: debug => {
    if (debug || process.env.DEBUG) {
      global.DEBUG_MODE = true
      return true
    }
  },
})

// Add epilogue
cmd.epilogue('For more information, check out https://hack.aragon.org')

// Run
const reporter = new ConsoleReporter()
reporter.debug(JSON.stringify(process.argv))
cmd
  .fail((msg, err, yargs) => {
    if (!err) yargs.showHelp()
    reporter.error(msg || err.message || 'An error occurred')
    reporter.debug(err && err.stack)
    process.exit(1)
  })
  .parse(process.argv.slice(2), {
    reporter,
  })
