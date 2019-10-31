const execHandler = require('./utils/execHandler').handler
const daoArg = require('./utils/daoArg')
const { parseArgumentStringIfPossible } = require('../../util')

exports.command = 'exec <dao> <proxy-address> <fn> [fn-args..]'

exports.describe = 'Executes a call in an app of a DAO'

exports.builder = function(yargs) {
  return daoArg(yargs)
    .positional('proxy-address', {
      description: 'Proxy address of the app with the function to be run',
    })
    .positional('fn', {
      description: 'Function to be executed',
    })
    .option('fn-args', {
      description: 'Arguments to be passed to the function',
      array: true,
      default: [],
    })
}

exports.handler = async function({
  reporter,
  dao,
  apm,
  network,
  proxyAddress,
  fn,
  fnArgs,
  wsProvider,
}) {
  return execHandler({
    dao,
    app: proxyAddress,
    method: fn,
    params: fnArgs.map(parseArgumentStringIfPossible),
    ipfsCheck: true,
    reporter,
    apm,
    network,
    wsProvider,
  })
}
