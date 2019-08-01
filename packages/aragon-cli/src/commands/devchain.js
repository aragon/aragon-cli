const startCommand = require('./devchain_cmds/start')

exports.builder = function(yargs) {
  return startCommand.builder(yargs).commandDir('devchain_cmds')
}

exports.command = 'devchain'
exports.describe = 'Shortcut for `aragon devchain start`.'
exports.handler = startCommand.handler
