import daoArg from './dao_cmds/utils/daoArg'

export const command = 'dao <command>'
export const describe = 'Manage your Aragon DAO'

export const builder = function(yargs) {
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
