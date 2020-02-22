import web3EthAbi from 'web3-eth-abi'
import { abi as kernelAbi } from '@aragon/abis/os/artifacts/Kernel'
//
import { addressesEqual } from '../../utils/addresses'

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
