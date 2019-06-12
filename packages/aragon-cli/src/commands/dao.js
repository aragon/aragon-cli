const daoArg = require('./dao_cmds/utils/daoArg')

exports.command = 'dao <command>'

exports.describe = 'Manage your Aragon DAO'

exports.builder = function(yargs) {
  if (
    process.argv[3] !== 'new' &&
    process.argv[3] !== 'act' &&
    process.argv[3] !== 'token'
  ) {
    yargs = daoArg(yargs)
  }
  return yargs
    .commandDir('dao_cmds')
    .demandCommand(1, 'You need to specify a command')
}
