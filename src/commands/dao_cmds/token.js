exports.command = 'token <command>'

exports.describe = 'Create and interact with MiniMe tokens'

exports.builder = function(yargs) {
  const cmd = yargs.commandDir('token_cmds')
  cmd.demandCommand(1, 'You need to specify a command')
  return cmd
}
