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

      // Wrap command handler
      const _handler = cmd.handler
      cmd.handler = (argv) => {
        // Set `cwd`
        argv.cwd = cmd.shouldRunInCwd ? process.cwd() : findProjectRoot()

        // Add reporter
        const reporter = new ConsoleReporter()

        // Handle errors
        _handler(reporter, argv)
          .then((exitCode = 0) => {
            process.exitCode = exitCode
          })
          .catch((err) => {
            reporter.error(err.message)
          })
      }

      return cmd
    }
  })

// Configure CLI behaviour
cmd.demandCommand()

// Set global options
cmd.option('silent', {
  default: false
})

// Add epilogue
cmd.epilogue('For more information, check out https://wiki.aragon.one')

// Run
cmd.argv // eslint-disable-line
