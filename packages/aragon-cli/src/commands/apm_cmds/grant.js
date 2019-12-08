import { blue, red } from 'chalk'
import grantNewVersionsPermission from '@aragon/toolkit/dist/apm/grantNewVersionsPermission'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

export const command = 'grant [grantees..]'
export const describe =
  'Grant an address permission to create new versions in this package'

export const builder = function(yargs) {
  return yargs.positional('grantees', {
    description:
      'The address being granted the permission to publish to the repo',
    array: true,
    default: [],
  })
}

export const handler = async function({
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
        // eslint-disable-next-line no-case-declarations
        const address = data
        reporter.info(
          `Granting permission to publish on ${blue(
            module.appName
          )} for ${address}`
        )
        break
      case 3:
        // eslint-disable-next-line no-case-declarations
        const txHash = data
        reporter.success(`Successful transaction (${blue(txHash)})`)
        break
    }
  }

  try {
    await grantNewVersionsPermission(
      web3,
      module.appName,
      apmOptions,
      grantees,
      progressHandler,
      { gasPrice: gasPrice || network.gasPrice }
    )
  } catch (err) {
    reporter.error(`${err}\n${red('Command failed')}`)
    process.exit(1)
  }

  process.exit(0)
}
