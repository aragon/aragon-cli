import { keccak256 } from 'web3-utils'
import { getAclAddress, resolveAddressOrEnsDomain } from '@aragon/toolkit'
//
import { handler as execHandler } from '../../utils/execHandler'

export default async function(
  dao,
  method,
  params,
  { reporter, environment, role, silent, debug }
) {
  const aclAddress = await getAclAddress(
    await resolveAddressOrEnsDomain(dao, environment),
    environment
  )

  const processedParams = role.startsWith('0x')
    ? params
    : params.map(param => (param === role ? keccak256(role) : param))

  return execHandler({
    reporter,
    environment,
    dao,
    app: aclAddress,
    method,
    params: processedParams,
    silent,
    debug,
  })
}
