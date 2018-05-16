const { runTruffle } = require('../helpers/truffle-runner')

exports.command = 'contracts'

exports.describe = 'Execute any Truffle command with arguments'

exports.handler = async function ({ reporter, cwd }) {
  const truffleArgs = process.argv.slice(process.argv.indexOf('contracts') + 1, process.argv.length)

  reporter.info('Passing the command to Truffle')
  try {
    await runTruffle(truffleArgs, {})
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}
