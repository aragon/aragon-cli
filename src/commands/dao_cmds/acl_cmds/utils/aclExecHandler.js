const execHandler = require('../../utils/execHandler').handler
const { keccak256 } = require('js-sha3')

module.exports = async function(
  dao,
  method,
  params,
  { reporter, apm, network, wsProvider, role }
) {
  const getTransactionPath = async wrapper => {
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
    reporter,
    apm,
    wsProvider,
    network,
  })
}
