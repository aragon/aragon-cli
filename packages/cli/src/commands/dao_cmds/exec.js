import { blue } from 'chalk'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

import { task as execHandler } from './utils/execHandler'
import daoArg from './utils/daoArg'
import { parseArgumentStringIfPossible } from '../../util'

export const command = 'exec <dao> <proxy-address> <fn> [fn-args..]'
export const describe = 'Executes a call in an app of a DAO'

export const builder = function(yargs) {
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

export const handler = async function({
  reporter,
  dao,
  apm,
  network,
  gasPrice,
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
    gasPrice,
    apm,
    network,
    wsProvider,
    web3: await ensureWeb3(network),
  })
  const { transactionPath } = await task.run()

  reporter.newLine()
  reporter.success(
    `Successfully executed: "${blue(transactionPath.description)}"`
  )
}
