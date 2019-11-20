const { ensureWeb3 } = require('../../helpers/web3-fallback')
const chalk = require('chalk')
const grantNewVersionsPermission = require('../../lib/apm/grantNewVersionsPermission')

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
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const progressHandler = (step, data) => {
    switch (step) {
      case 1:
        reporter.info(`Fetching repository`)
        break
      case 2:
        const address = data
        reporter.info(
          `Granting permission to publish on ${chalk.blue(
            module.appName
          )} for ${address}`
        )
        break
      case 3:
        const txHash = data
        reporter.success(`Successful transaction (${chalk.blue(txHash)})`)
        break
      case 4:
        reporter.error(`${data}\n${chalk.red('Transaction failed')}`)
        process.exit(1)
    }
  }

  await grantNewVersionsPermission(
    web3,
    module.appName,
    apmOptions,
    grantees,
    progressHandler,
    { gasPrice: gasPrice || network.gasPrice }
  )

  process.exit(0)
}
