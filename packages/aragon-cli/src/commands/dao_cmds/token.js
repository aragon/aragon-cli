export const command = 'token <command>'
export const describe = 'Create and interact with MiniMe tokens'

export const builder = function(yargs) {
  return yargs
    .commandDir('token_cmds')
    .demandCommand(1, 'You need to specify a command')
}
