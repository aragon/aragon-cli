const ABI = require('web3-eth-abi')
const execHandler = require('./utils/execHandler').handler
const getAppKernel = require('./utils/app-kernel')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const { parseStringIfPossible, ZERO_ADDRESS } = require('../../util')

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
      description: 'Function to be executed',
      type: 'string',
    })
    .option('call-args', {
      description: 'Arguments to be passed to the function',
      array: true,
      default: [],
    })
  // TODO: Add an optional argument to provide the eth value for the execution
}

const encodeCalldata = (signature, params) => {
  const sigBytes = ABI.encodeFunctionSignature(signature)

  const types = signature.replace(')', '').split('(')[1]

  // No params, return signature directly
  if (types === '') {
    return sigBytes
  }

  const paramBytes = ABI.encodeParameters(types.split(','), params)

  return `${sigBytes}${paramBytes.slice(2)}`
}

exports.handler = async function({
  reporter,
  apm,
  network,
  agentAddress,
  target,
  signature,
  callArgs,
  wsProvider,
}) {
  // TODO (daniel) refactor ConsoleReporter so we can do reporter.debug instead
  if (global.DEBUG_MODE) console.log('call-args before parsing', callArgs)
  callArgs = callArgs.map(parseStringIfPossible)
  if (global.DEBUG_MODE) console.log('call-args after parsing', callArgs)

  const web3 = await ensureWeb3(network)
  const dao = await getAppKernel(web3, agentAddress)

  if (dao === ZERO_ADDRESS) {
    throw new Error(
      'Invalid Agent app address, cannot find Kernel reference in contract'
    )
  }

  const fnArgs = [target, 0, encodeCalldata(signature, callArgs)]

  const getTransactionPath = wrapper =>
    wrapper.getTransactionPath(agentAddress, EXECUTE_FUNCTION_NAME, fnArgs)

  return execHandler(dao, getTransactionPath, {
    reporter,
    apm,
    network,
    wsProvider,
  })
}
