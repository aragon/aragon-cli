import { blue } from 'chalk'
import { EXECUTE_FUNCTION_NAME } from '@aragon/toolkit/dist/helpers/constants'
import getAppKernel from '@aragon/toolkit/dist/kernel/getAppKernel'
import encodeActCall from '@aragon/toolkit/dist/dao/encodeActCall'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

import { task as execHandler } from './utils/execHandler'
import { parseArgumentStringIfPossible } from '../../util'

export const command = 'act <agent-address> <target> [signature] [call-args..]'
export const describe = 'Executes an action from the Agent app'

export const builder = function(yargs) {
  return yargs
    .positional('agent-address', {
      description: 'Address of the Agent app proxy',
      type: 'string',
    })
    .positional('target', {
      description: 'Address where the action is being executed',
      type: 'string',
    })
    .option('signature', {
      description:
        'Signature of the function to be executed (e.g. "myMethod(uint256,string)"',
      type: 'string',
    })
    .option('call-args', {
      description: 'Arguments to be passed to the function',
      array: true,
      default: [],
    })
    .option('call-data', {
      description: 'Raw call data',
      type: 'string',
      default: '0x',
    })
    .option('eth-value', {
      description:
        'Amount of ETH from the contract that is sent with the action',
      default: '0',
    })
}

export const handler = async function({
  reporter,
  apm,
  network,
  agentAddress,
  target,
  signature,
  callArgs,
  callData,
  ethValue,
  wsProvider,
}) {
  const web3 = await ensureWeb3(network)
  const dao = await getAppKernel(web3, agentAddress)

  const encodedCallData = signature
    ? encodeActCall(signature, callArgs.map(parseArgumentStringIfPossible))
    : callData

  reporter.debug('Encoded call data: ', encodedCallData)

  const task = execHandler({
    dao,
    app: agentAddress,
    method: EXECUTE_FUNCTION_NAME,
    params: [target, web3.utils.toWei(ethValue), encodedCallData],
    reporter,
    apm,
    network,
    wsProvider,
    web3,
  })

  const { transactionPath } = await task.run()

  reporter.success(
    `Successfully executed: "${blue(transactionPath.description)}"`
  )
}
