#!/usr/bin/env node
const ConsoleReporter = require('./reporters/ConsoleReporter')

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
