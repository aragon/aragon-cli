const execHandler = require('./utils/execHandler').handler
const daoArg = require('./utils/daoArg')

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
}) {
  const getTransactionPath = wrapper =>
    wrapper.getTransactionPath(proxyAddress, fn, fnArgs)
  return execHandler(dao, getTransactionPath, { reporter, apm, network })
}
