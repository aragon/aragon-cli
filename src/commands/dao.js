const daoArg = require('./dao_cmds/utils/daoArg')
const {
  manifestMiddleware,
  moduleMiddleware,
  environmentMiddleware,
} = require('../middleware')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware,
  environmentMiddleware,
]

exports.command = 'dao <command>'

exports.describe = 'Manage your Aragon DAO'

exports.builder = function(yargs) {
  if (process.argv[3] !== 'new') {
    yargs = daoArg(yargs)
  }

  const cmd = yargs.commandDir('dao_cmds', {
    visit: cmd => {
      // Add middlewares
      cmd.middlewares = MIDDLEWARES
      return cmd
    },
  })
  cmd.demandCommand(1, 'You need to specify a command')

  return cmd
}
