const {
  manifestMiddleware,
  moduleMiddleware,
  environmentMiddleware
} = require('../middleware')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware,
  environmentMiddleware
]

exports.command = 'apm <command>'

exports.describe = 'Publish and manage your APM package'

exports.aliases = ['package']

exports.builder = function (yargs) {
  const cmd = yargs.commandDir('apm_cmds', {
    visit: (cmd) => {
      // Add middlewares
      cmd.middlewares = MIDDLEWARES
      return cmd
    }
  })
  cmd.demandCommand(1, 'You need to specify a command')

  return cmd
}
