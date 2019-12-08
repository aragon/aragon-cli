import startCommand from './devchain_cmds/start'

export const builder = function(yargs) {
  return startCommand.builder(yargs).commandDir('devchain_cmds')
}

export const command = 'devchain'
export const describe = 'Shortcut for `aragon devchain start`.'
export const handler = startCommand.handler
