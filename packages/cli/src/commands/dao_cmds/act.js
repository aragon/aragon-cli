import { blue } from 'chalk'
import { toWei } from 'web3-utils'
import {
  EXECUTE_FUNCTION_NAME,
  getKernelAddress,
  encodeActCall,
} from '@aragon/toolkit'
//
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
  environment,
  agentAddress,
  target,
  signature,
  callArgs,
  callData,
  ethValue,
}) {
  const dao = await getKernelAddress(agentAddress, environment)

  const encodedCallData = signature
    ? encodeActCall(signature, callArgs.map(parseArgumentStringIfPossible))
    : callData

  reporter.debug('Encoded call data: ', encodedCallData)

  const task = await execHandler({
    reporter,
    environment,
    dao,
    app: agentAddress,
    method: EXECUTE_FUNCTION_NAME,
    params: [target, toWei(ethValue), encodedCallData],
  })

  const { transactionPath } = await task.run()

  reporter.newLine()
  reporter.success(
    `Successfully executed: "${blue(transactionPath.description)}"`
  )
}
