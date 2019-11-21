const web3EthAbi = require('web3-eth-abi')
const kernelAbi = require('@aragon/os/build/contracts/Kernel').abi
const { addressesEqual } = require('../../util')

const newAppProxyLogName = 'NewAppProxy'
const newAppProxyLogAbi = kernelAbi.find(
  ({ type, name }) => type === 'event' && name === newAppProxyLogName
)
// This check is run outside the function body so it can be catched
// on every any run when it happens, instead on a specific function call
if (!newAppProxyLogAbi) {
  throw new Error(`aragonCLI is out of sync with aragon/os, please report this issue:
Kernel ABI does not include expected log '${newAppProxyLogName}'`)
}

/**
 * Returns aclAddress for a DAO
 *
 * @param {string} dao DAO address
 * @param {Object} web3 Web3 initialized object
 * @return {Promise<string>} aclAddress
 */
async function getAclAddress(dao, web3) {
  const daoInstance = new web3.eth.Contract(kernelAbi, dao)
  return daoInstance.methods.acl().call()
}

/**
 * Returns new app proxy contract address
 *
 * @param {string} dao DAO address
 * @param {Object} receipt Web3 receipt object
 * @return {string|undefined} app proxy contract address
 */
function getAppProxyAddressFromReceipt(dao, receipt) {
  const logTopic = web3EthAbi.encodeEventSignature(newAppProxyLogAbi)

  const deployLog = receipt.logs.find(({ topics, address }) => {
    return topics[0] === logTopic && addressesEqual(dao, address)
  })

  if (!deployLog) return

  const log = web3EthAbi.decodeLog(newAppProxyLogAbi.inputs, deployLog.data)
  if (!log.proxy)
    throw new Error(`aragonCLI is out of sync with aragon/os, please report this issue:
Kernel ABI log ${newAppProxyLogName} does not have expected argument 'log'`)
  return log.proxy
}

/**
 * Returns the current app base address for an appId
 *
 * @param {string} dao DAO address
 * @param {string} appId APP id to get the base of
 * @param {Object} web3 Web3 initialized object
 * @return {Promise<string>} currentBaseAddress
 */
async function getAppBase(dao, appId, web3) {
  const kernel = new web3.eth.Contract(kernelAbi, dao)
  const basesNamespace = await kernel.methods.APP_BASES_NAMESPACE().call()
  return kernel.methods.getApp(basesNamespace, appId).call()
}

module.exports = {
  getAclAddress,
  getAppProxyAddressFromReceipt,
  getAppBase,
}
