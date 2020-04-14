import * as commands from './ipfs_cmds'

export const builder = (yargs) =>
  yargs
    // the order matters for --help
    .command(commands.install)
    .command(commands.start)
    .command(commands.stop)
    .command(commands.status)
    .command(commands.view)
    .command(commands.propagate)
    .command(commands.uninstall)
    .usage(`Usage: aragon ipfs <command> [options]`)
    .demandCommand(1, 'You need to specify a command')

export const command = 'ipfs <command>'
export const describe = 'Manage an IPFS node'
