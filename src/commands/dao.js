const daoArg = require('./dao_cmds/utils/daoArg')

exports.command = 'dao <command>'

exports.describe = 'Manage your Aragon DAO'

exports.builder = function (yargs) {
  if (process.argv[3] !== 'new') {
    yargs = daoArg(yargs)
  }

  const cmd = yargs.commandDir('dao_cmds')
  cmd.demandCommand(1, 'You need to specify a command')

  return cmd
}
