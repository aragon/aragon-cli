const execHandler = require('./utils/execHandler').handler
const getAppKernel = require('../../lib/getAppKernel')
const web3 = require('web3')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const { parseArgumentStringIfPossible } = require('../../util')
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
  const dao = await getAppKernel(await ensureWeb3(network), agentAddress)

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
