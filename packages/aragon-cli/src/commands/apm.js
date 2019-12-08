export const command = 'apm <command>';
export const describe = 'Publish and manage your aragonPM package';
export const aliases = ['package'];

export const builder = function(yargs) {
  return yargs
    .commandDir('apm_cmds')
    .demandCommand(1, 'You need to specify a command')
};
