import { keccak256 } from 'web3-utils'
import { getAclAddress, resolveAddressOrEnsDomain } from '@aragon/toolkit'
//
import { handler as execHandler } from '../../utils/execHandler'
import { ensureWeb3 } from '../../../../helpers/web3-fallback'

export default async function (
  dao,
  method,
  params,
  { reporter, apm, network, gasPrice, wsProvider, role, silent, debug }
) {
  const web3 = await ensureWeb3(network)
  const aclAddress = await getAclAddress(
    await resolveAddressOrEnsDomain(dao, web3, apm.ensRegistryAddress),
    web3
  )

  const processedParams = role.startsWith('0x')
    ? params
    : params.map((param) => (param === role ? keccak256(role) : param))

  return execHandler({
    dao,
    app: aclAddress,
    method,
    params: processedParams,
    reporter,
    gasPrice,
    apm,
    web3,
    wsProvider,
    silent,
    debug,
  })
}
