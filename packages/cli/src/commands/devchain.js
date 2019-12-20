import {
  handler as startCommandHandler,
  builder as startCommandBuilder,
} from './devchain_cmds/start'

export const builder = function(yargs) {
  yargs
  return startCommandBuilder(yargs).commandDir('devchain_cmds')
}

export const command = 'devchain'
export const describe = 'Shortcut for `aragon devchain start`.'
export const handler = startCommandHandler
