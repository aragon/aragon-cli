exports.command = 'token <command>'

exports.describe = 'Create and interact with MiniMe tokens'

exports.builder = function(yargs) {
  return yargs
    .commandDir('token_cmds')
    .demandCommand(1, 'You need to specify a command')
}
