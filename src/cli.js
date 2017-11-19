#!/usr/bin/env node
const ConsoleReporter = require('./reporters/ConsoleReporter')
const findUp = require('find-up')

const findProjectRoot = () =>
  findUp.sync('manifest.json')

// Set up commands
const cmd = require('yargs')
  .commandDir('./commands', {
    visit: (cmd) => {
      // Add examples
      if (cmd.examples) {
        const _builder = cmd.builder
        cmd.builder = (yargs) => {
          const builder = _builder(yargs)
          cmd.examples.forEach((example) =>
            builder.example(...example))

          return yargs
        }
      }

      // Add reporter
      const _handler = cmd.handler
      cmd.handler = (argv) =>
        _handler(new ConsoleReporter(), argv)

      // Add `cwd`
      const __handler = cmd.handler
      cmd.handler = (argv) => {
        argv.cwd = cmd.shouldRunInCwd ? process.cwd() : findProjectRoot()

        return __handler(argv)
      }

      return cmd
    }
  })

// Configure CLI behaviour
cmd.demandCommand()
cmd.showHelpOnFail(false, 'Specify --help for available options')

// Set global options
cmd.option('silent', {
  default: false
})

// Add epilogue
cmd.epilogue('For more information, check out https://wiki.aragon.one')

// Run
cmd.argv // eslint-disable-line
