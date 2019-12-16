const { keccak256 } = require('web3-utils')
const { getAclAddress } = require('@aragon/toolkit/dist/kernel/kernel')
//
const execHandler = require('../../utils/execHandler').handler
const {
  resolveAddressOrEnsDomain,
} = require('@aragon/toolkit/dist/dao/utils/resolveAddressOrEnsDomain')
const { ensureWeb3 } = require('../../../../helpers/web3-fallback')

module.exports = async function(
  dao,
  method,
  params,
  { reporter, apm, network, gasPrice, wsProvider, role, silent, debug }
) {
  const web3 = await ensureWeb3(network)
  const apmRegistry = apm.registryAddress || apm['ens-registry']
  const aclAddress = await getAclAddress(
    await resolveAddressOrEnsDomain(dao, web3, apmRegistry), 
    web3
  )

  const processedParams = role.startsWith('0x')
    ? params
    : params.map(param => (param === role ? keccak256(role) : param))

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
