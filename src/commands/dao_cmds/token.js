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

exports.command = 'token <command>'

exports.describe = 'Create and interact with MiniMe tokens'

exports.builder = function(yargs) {
  return yargs
    .commandDir('token_cmds', {
      visit: cmd => {
        cmd.middlewares = MIDDLEWARES
        return cmd
      },
    })
    .demandCommand(1, 'You need to specify a command')
}
