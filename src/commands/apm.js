exports.command = 'apm <command>'

exports.describe = 'Publish and manage your APM package'

exports.aliases = ['package']

exports.builder = function(yargs) {
  const cmd = yargs.commandDir('apm_cmds')
  cmd.demandCommand(1, 'You need to specify a command')

  return cmd
}
