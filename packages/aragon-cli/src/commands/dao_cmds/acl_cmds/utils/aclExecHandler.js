const execHandler = require('../../utils/execHandler').handler
const { keccak256 } = require('js-sha3')
const { map, filter, first } = require('rxjs/operators')
const { addressesEqual } = require('../../../../util')

module.exports = async function(
  dao,
  method,
  params,
  { reporter, apm, network, gasPrice, wsProvider, role, silent, debug }
) {
  const getTransactionPath = async wrapper => {
    const aclAddr = wrapper.aclProxy.address
    // Wait for app info to load
    await wrapper.apps.pipe(
      map(apps => apps.find(app => addressesEqual(app.proxyAddress, aclAddr))),
      filter(app => app),
      first()
    ).toPromise()

    let processedParams

    // If the provided role is its name, the name is hashed
    // TODO: Get role bytes from app artifacts
    if (role.startsWith('0x')) {
      processedParams = params
    } else {
      processedParams = params.map(param =>
        param === role ? '0x' + keccak256(role) : param
      )
    }

    return wrapper.getACLTransactionPath(method, processedParams)
  }
  return execHandler(dao, getTransactionPath, {
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
