import web3EthAbiUntyped, { AbiCoder } from 'web3-eth-abi'
import { AbiItem } from 'web3-utils'
import { TransactionReceipt } from 'web3-core'
//
import { addressesEqual } from '../../utils/addresses'
import { kernelAbi } from '../../contractAbis'

// Fix necessary due to wrong type exports in web3-eth-abi
const web3EthAbi: AbiCoder = web3EthAbiUntyped as any

/**
 * Returns new app proxy contract address
 *
 * @param {string} dao DAO address
 * @param {Object} receipt Web3 receipt object
 * @return {string|undefined} app proxy contract address
 */
export function getAppProxyAddressFromReceipt(
  dao: string,
  receipt: TransactionReceipt
) {
  const newAppProxyLogName = 'NewAppProxy'
  const newAppProxyLogAbi = kernelAbi.find(
    ({ type, name }: AbiItem) => type === 'event' && name === newAppProxyLogName
  )
  // This check is run outside the function body so it can be catched
  // on every any run when it happens, instead on a specific function call
  if (!newAppProxyLogAbi) {
    throw new Error(`aragonCLI is out of sync with aragon/os, please report this issue:
Kernel ABI does not include expected log '${newAppProxyLogName}'`)
  }

  const logTopic = web3EthAbi.encodeEventSignature(newAppProxyLogAbi)

  const deployLog = receipt.logs.find(({ topics, address }) => {
    return topics[0] === logTopic && addressesEqual(dao, address)
  })

  if (!deployLog) return

  if (!newAppProxyLogAbi.inputs || !newAppProxyLogAbi.inputs.length)
    throw Error(`newAppProxyLogAbi should have inputs`)

  const log = web3EthAbi.decodeLog(newAppProxyLogAbi.inputs, deployLog.data, [])
  if (!log.proxy)
    throw new Error(`aragonCLI is out of sync with aragon/os, please report this issue:
Kernel ABI log ${newAppProxyLogName} does not have expected argument 'log'`)
  return log.proxy
}
