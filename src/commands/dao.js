const daoArg = require('./dao_cmds/utils/daoArg')
const {
  manifestMiddleware,
  moduleMiddleware
} = require('../middleware')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware
]

exports.command = 'dao <command>'

exports.describe = 'Manage your Aragon DAO'

exports.builder = function (yargs) {
  const cmd = daoArg(yargs).commandDir('dao_cmds', {
    visit: (cmd) => {
      // Add middlewares
      cmd.middlewares = MIDDLEWARES
      return cmd
    }
  })
  cmd.demandCommand(1, 'You need to specify a command')

  return cmd
}