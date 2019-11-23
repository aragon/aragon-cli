import { handler as execHandler } from '../../utils/execHandler'
import { keccak256 } from 'web3-utils'
import { ensureWeb3 } from '../../../../helpers/web3-fallback'

export default async function(
  dao,
  method,
  params,
  { reporter, apm, network, gasPrice, wsProvider, role, silent, debug }
) {
  const web3 = await ensureWeb3(network)
  const daoInstance = new web3.eth.Contract(
    require('@aragon/os/build/contracts/Kernel').abi,
    dao
  )
  const aclAddress = await daoInstance.methods.acl().call()

  const processedParams = role.startsWith('0x')
    ? params
    : params.map(param => (param === role ? keccak256(role) : param))

  return execHandler({
    dao,
    app: aclAddress,
    method,
    params: processedParams,
    ipfsCheck: false,
    reporter,
    gasPrice,
    apm,
    wsProvider,
    network,
    silent,
    debug,
  })
}
