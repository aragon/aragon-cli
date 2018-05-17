const appsCommand = require('./dao_cmds/apps')
const daoArg = require('./dao_cmds/utils/daoArg')
const {
  manifestMiddleware,
  moduleMiddleware
} = require('../middleware')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware
]

exports.command = 'apm <command>'

exports.describe = 'Publish and manage your APM package'

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