exports.command = 'apm <command>'

exports.describe = 'Publish and manage your aragonPM package'

exports.aliases = ['package']

exports.builder = function(yargs) {
  return yargs
    .commandDir('apm_cmds')
    .demandCommand(1, 'You need to specify a command')
}
