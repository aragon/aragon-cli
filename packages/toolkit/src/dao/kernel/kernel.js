import web3EthAbi from 'web3-eth-abi'
import { abi as kernelAbi } from '@aragon/abis/os/artifacts/Kernel'
//
import { addressesEqual } from '../../util'
import { useEnvironment } from '../../helpers/useEnvironment'

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
 * @param  {string} environment Envrionment
 * @return {Promise<string>} aclAddress
 */
export async function getAclAddress(dao, environment) {
  const { web3 } = useEnvironment(environment)

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
export function getAppProxyAddressFromReceipt(dao, receipt) {
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
 * @param  {string} environment Envrionment
 * @return {Promise<string>} basesNamespace
 */
export async function getBasesNamespace(dao, environment) {
  const { web3 } = useEnvironment(environment)

  const kernel = new web3.eth.Contract(kernelAbi, dao)
  return kernel.methods.APP_BASES_NAMESPACE().call()
}

/**
 * Returns the current app base address for an appId
 *
 * @param {string} dao DAO address
 * @param {string} appId APP id to get the base of
 * @param  {string} environment Envrionment
 * @return {Promise<string>} currentBaseAddress
 */
export async function getAppBase(dao, appId, environment) {
  const { web3 } = useEnvironment(environment)

  const kernel = new web3.eth.Contract(kernelAbi, dao)
  const basesNamespace = await getBasesNamespace(dao, environment)
  return kernel.methods.getApp(basesNamespace, appId).call()
}
