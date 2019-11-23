import { runTruffle } from '../helpers/truffle-runner'

export const command = 'contracts'
export const describe = 'Execute any Truffle command with arguments'

export const handler = async function({ reporter, cwd }) {
  const truffleArgs = process.argv.slice(
    process.argv.indexOf('contracts') + 1,
    process.argv.length
  )

  reporter.info('Passing the command to Truffle')
  try {
    await runTruffle(truffleArgs, {})
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}
