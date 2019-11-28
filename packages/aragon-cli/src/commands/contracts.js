const { contracts, extractTruffleArgs } = require('../lib/contracts')

exports.command = 'contracts [command]'

// yargs interprets `aragon contracts help` as its own help,
// so advise users to type `aragon contracts` for Truffle's help.
exports.describe =
  'Execute any Truffle command with arguments. Type "aragon contracts" to display Truffle\'s help.'

exports.builder = yargs => {
  return yargs.positional('command', {
    description: 'Truffle command',
  })
}

exports.handler = async function({ reporter }) {
  reporter.info('Passing the command to Truffle')
  await contracts(extractTruffleArgs(process.argv))
  process.exit(0)
}
