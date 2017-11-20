#!/usr/bin/env node
const ConsoleReporter = require('./reporters/ConsoleReporter')
const Web3 = require('web3')
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
            process.exitCode = 1
          })
      }

      return cmd
    }
  })

// Configure CLI behaviour
cmd.demandCommand()

// Set global options
cmd.option('silent', {
  description: 'Silence output to terminal',
  default: false
})
cmd.option('ens-registry', {
  description: 'Address of the ENS registry'
})
cmd.option('eth-rpc', {
  description: 'An URI to the Ethereum node used for RPC calls',
  default: 'http://localhost:8545',
  coerce: (rpc) => {
    return new Web3(rpc)
  }
})

// Add epilogue
cmd.epilogue('For more information, check out https://wiki.aragon.one')

// Run
cmd.argv // eslint-disable-line
