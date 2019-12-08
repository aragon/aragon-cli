import viewCommand from './acl_cmds/view'

export const command = 'acl <dao>'
export const describe =
  'View and manage your DAO permissions. Shortcut for aragon dao acl view <dao>'

export const builder = function(yargs) {
  return yargs.commandDir('acl_cmds')
}

export const handler = viewCommand.handler
