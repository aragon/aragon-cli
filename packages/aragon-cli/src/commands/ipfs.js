const startCommand = require('./ipfs_cmds/start')

exports.builder = function(yargs) {
  return yargs.commandDir('ipfs_cmds')
}

exports.command = 'ipfs'
exports.describe = 'Shortcut for aragon ipfs start'
exports.handler = startCommand.handler
