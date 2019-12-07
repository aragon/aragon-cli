const { blue } = require('chalk')
const {
  EXECUTE_FUNCTION_NAME,
} = require('@aragon/toolkit/dist/helpers/constants')
const getAppKernel = require('@aragon/toolkit/dist/kernel/getAppKernel')
const encodeActCall = require('@aragon/toolkit/dist/dao/encodeActCall')
//
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const execHandler = require('./utils/execHandler').task
const { parseArgumentStringIfPossible } = require('../../util')

exports.command = 'act <agent-address> <target> [signature] [call-args..]'

exports.describe = 'Executes an action from the Agent app'

exports.builder = function(yargs) {
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

exports.handler = async function({
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
  process.exit()
}
