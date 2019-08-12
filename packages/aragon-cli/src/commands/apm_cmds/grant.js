const APM = require('@aragon/apm')
const ACL = require('../../acl')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const chalk = require('chalk')

exports.command = 'grant [grantees..]'
exports.describe =
  'Grant an address permission to create new versions in this package'

exports.builder = function(yargs) {
  return yargs.positional('grantees', {
    description:
      'The address being granted the permission to publish to the repo',
    array: true,
    default: [],
  })
}

exports.handler = async function({
  // Globals
  reporter,
  gasPrice,
  network,
  module,
  apm: apmOptions,
  // Arguments
  grantees,
}) {
  const web3 = await ensureWeb3(network)

  const apm = await APM(web3, apmOptions)
  const acl = ACL({ web3, network })

  const repo = await apm.getRepository(module.appName).catch(() => null)
  if (repo === null) {
    throw new Error(
      `Repository ${module.appName} does not exist and it's registry does not exist`
    )
  }

  if (grantees.length === 0) {
    reporter.warning('No grantee addresses provided')
  }

  /* eslint-disable-next-line */
  for (const address of grantees) {
    reporter.info(
      `Granting permission to publish on ${chalk.blue(
        module.appName
      )} for ${chalk.green(address)}`
    )

    // Decode sender
    const accounts = await web3.eth.getAccounts()
    const from = accounts[0]

    // Build transaction
    const transaction = await acl.grant(repo.options.address, address)

    transaction.from = from
    transaction.gasPrice = network.gasPrice || gasPrice
    // the recommended gasLimit is already calculated by the ACL module

    try {
      const receipt = await web3.eth.sendTransaction(transaction)
      reporter.success(
        `Successful transaction (${chalk.blue(receipt.transactionHash)})`
      )
    } catch (e) {
      reporter.error(`${e}\n${chalk.red('Transaction failed')}`)
      process.exit(1)
    }
  }

  process.exit(0)
}
