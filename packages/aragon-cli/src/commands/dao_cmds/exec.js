const execHandler = require('./utils/execHandler').task
const daoArg = require('./utils/daoArg')
const { parseArgumentStringIfPossible } = require('../../util')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const chalk = require('chalk')

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
  const task = await execHandler({
    dao,
    app: proxyAddress,
    method: fn,
    params: fnArgs.map(parseArgumentStringIfPossible),
    reporter,
    apm,
    network,
    wsProvider,
    web3: await ensureWeb3(network),
  })
  const { transactionPath } = await task.run()

  reporter.success(
    `Successfully executed: "${chalk.blue(transactionPath.description)}"`
  )
  process.exit()
}
