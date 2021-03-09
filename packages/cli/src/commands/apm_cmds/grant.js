import APM from '@aragon/apm'
import { handler as ACLGrantHandler } from '../dao_cmds/acl_cmds/grant'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

export const command = 'grant [grantees..]'
export const describe =
  'Grant an address permission to create new versions in this package'

export const builder = function (yargs) {
  return yargs.positional('grantees', {
    description:
      'The address being granted the permission to publish to the repo',
    array: true,
    default: [],
  })
}

export const handler = async function ({
  // Globals
  reporter,
  gasPrice,
  network,
  module,
  wsProvider,
  apm: apmOptions,
  // Arguments
  grantees,
}) {
  const web3 = await ensureWeb3(network)
  const apm = await APM(web3, apmOptions)

  const repo = await apm.getRepository(module.appName)
  const dao = await repo.methods.kernel().call()

  for (const entity of grantees) {
    await ACLGrantHandler({
      reporter,
      dao,
      app: repo.options.address,
      role: 'CREATE_VERSION_ROLE',
      entity,
      network,
      provider: wsProvider || web3.currentProvider,
      apm,
      gasPrice: gasPrice || network.gasPrice,
      params: [],
    })
  }
}
