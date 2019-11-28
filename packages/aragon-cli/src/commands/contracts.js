const { contracts, extractTruffleArgs } = require('../lib/contracts')

exports.command = 'contracts [command]'

exports.describe = 'Execute any Truffle command with arguments'

exports.handler = async function({ reporter }) {
  reporter.info('Passing the command to Truffle')
  await contracts(extractTruffleArgs(process.argv))
  process.exit(0)
}
