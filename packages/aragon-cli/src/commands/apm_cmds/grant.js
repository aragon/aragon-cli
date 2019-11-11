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
  cwd,
  network,
  module,
  apm: apmOptions,
  // Arguments
  grantees,
}) {
  const web3 = await ensureWeb3(network)
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const progressHandler = (step, data) => {
    switch(step) {
      case 1:
        break
      case 2:
        break
      case 3:
        const address = data
        reporter.info(
          `Granting permission to publish on ${chalk.blue(
            module.appName
          )} for ${address}`
        )
        break
      case 4:
        const txHash = data
        reporter.success(
          `Successful transaction (${chalk.blue(txHash)})`
        )
        break
      case 5:
        reporter.error(`${e}\n${chalk.red('Transaction failed')}`)
        process.exit(1)
        break
      case 6:
        break
    }
  }

  await grantNewVersionsPermission(
    web3,
    module.appName,
    apmOptions,
    gasPrice || network.gasPrice,
    grantees,
    progressHandler
  )

  process.exit(0)
}
