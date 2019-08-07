const execHandler = require('./utils/execHandler').handler
const getAppKernel = require('./utils/app-kernel')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const ABI = require('web3-eth-abi')

const EXECUTE_FUNCTION_NAME = 'execute'
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

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
  ethValue,
  wsProvider,
}) {
  const web3 = await ensureWeb3(network)
  const dao = await getAppKernel(web3, agentAddress)

  if (dao === ZERO_ADDR) {
    throw new Error(
      'Invalid Agent app address, cannot find Kernel reference in contract'
    )
  }

  const weiAmount = web3.utils.toWei(ethValue)

  const fnArgs = [target, weiAmount, encodeCalldata(signature, callArgs)]

  const getTransactionPath = wrapper =>
    wrapper.getTransactionPath(agentAddress, EXECUTE_FUNCTION_NAME, fnArgs)

  return execHandler(dao, getTransactionPath, {
    reporter,
    apm,
    network,
    wsProvider,
  })
}
