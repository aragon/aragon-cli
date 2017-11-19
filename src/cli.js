#!/usr/bin/env node
const ConsoleReporter = require('./reporters/ConsoleReporter')
const findUp = require('find-up')

const findProjectRoot = () =>
  findUp.sync('manifest.json')

require('yargs')
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
        argv.cwd = cmd.shouldRunInCwd ? process.cwd() : 'root'

        return __handler(argv)
      }

      return cmd
    }
  })
  .demandCommand()
  .showHelpOnFail(false, 'Specify --help for available options')
  .option('silent', {
    default: false
  })
  .epilogue('For more information, check out https://wiki.aragon.one')
  .argv
