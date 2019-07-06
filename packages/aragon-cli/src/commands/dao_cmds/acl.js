const viewCommand = require('./acl_cmds/view')

exports.command = 'acl <dao>'

exports.describe =
  'View and manage your DAO permissions. Shortcut for aragon dao acl view <dao>'

exports.builder = function(yargs) {
  return yargs.commandDir('acl_cmds')
}

exports.handler = viewCommand.handler
