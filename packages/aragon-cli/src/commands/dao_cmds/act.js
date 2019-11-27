const execHandler = require('./utils/execHandler').handler
const getAppKernel = require('./utils/app-kernel')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const { parseArgumentStringIfPossible, ZERO_ADDRESS } = require('../../util')
const encodeActCall = require('../../lib/encodeActCall')

const EXECUTE_FUNCTION_NAME = 'execute'

exports.command = 'act <agent-address> <target> <signature> [call-args..]'

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
    .positional('signature', {
      description:
        'Signature of the function to be executed (e.g. "myMethod(uint256,string)"',
      type: 'string',
    })
    .option('call-args', {
      description: 'Arguments to be passed to the function',
      array: true,
      default: [],
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
  ethValue,
  wsProvider,
}) {
  reporter.debug('call-args after parsing', callArgs)

  const web3 = await ensureWeb3(network)
  const dao = await getAppKernel(web3, agentAddress)

  if (dao === ZERO_ADDRESS) {
    throw new Error(
      'Invalid Agent app address, cannot find Kernel reference in contract'
    )
  }

  return execHandler({
    dao,
    app: agentAddress,
    method: EXECUTE_FUNCTION_NAME,
    params: [
      target,
      web3.utils.toWei(ethValue),
      encodeActCall(signature, callArgs.map(parseArgumentStringIfPossible)),
    ],
    ipfsCheck: true,
    reporter,
    apm,
    network,
    wsProvider,
  })
}
