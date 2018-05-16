const appsCommand = require('./dao_cmds/apps')
const daoArg = require('./dao_cmds/utils/daoArg')

exports.command = 'dao <dao>'

exports.describe = 'Shortcut for aragon apps <dao>'

exports.builder = function (yargs) {
  return daoArg(yargs).commandDir('dao_cmds')
}

exports.handler = appsCommand.handler
