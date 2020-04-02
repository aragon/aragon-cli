import { blue } from 'chalk'
import { apmSetPermissionManager } from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

export const command = 'manager <entity>'
export const describe =
  'Set an entity as the permission manager of this package'

export const builder = function(yargs) {
  return yargs.positional('entity', {
    description:
      'The address to be the new permission manager ofthe repo',
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
  entity,
}) {
  const web3 = await ensureWeb3(network)

  const progressHandler = (step, data) => {
    switch (step) {
      case 1:
        reporter.info(`Fetching repository`)
        break
      case 2:
        // eslint-disable-next-line no-case-declarations
        const address = data
        reporter.info(
          `Setting permission manager for ${blue(
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

  await apmSetPermissionManager(
    web3,
    module.appName,
    apmOptions,
    entity,
    progressHandler,
    { gasPrice: gasPrice || network.gasPrice }
  )
}
