const viewCommand = require('./acl_cmds/view')

const {
  manifestMiddleware,
  moduleMiddleware,
  environmentMiddleware,
} = require('../../middleware')

const MIDDLEWARES = [
  manifestMiddleware,
  moduleMiddleware,
  environmentMiddleware,
]

exports.command = 'acl <dao>'

exports.describe = 'Shortcut for aragon dao acl view <dao>'

exports.builder = function(yargs) {
  return yargs.commandDir('acl_cmds', {
    visit: cmd => {
      cmd.middlewares = MIDDLEWARES
      return cmd
    },
  })
}

exports.handler = viewCommand.handler
