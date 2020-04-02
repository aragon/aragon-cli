import { blue } from 'chalk'
import { apmRevokePermission } from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

export const command = 'revoke entity'
export const describe =
  'Revoke an entity the permission to create new versions in this package'

export const builder = function(yargs) {
  return yargs.positional('entity', {
    description:
      'The address being revoked the permission to publish to the repo',
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
          `Revoking permission to publish on ${blue(
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

  await apmRevokePermission(
    web3,
    module.appName,
    apmOptions,
    entity,
    progressHandler,
    { gasPrice: gasPrice || network.gasPrice }
  )
}
