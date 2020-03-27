import TaskList from 'listr'
import { apmPublishVersion } from '@aragon/toolkit'
//
import listrOpts from '../../../helpers/listr-options'

export default async function runPublishTask({
  // Globals
  gasPrice,
  web3,
  module,
  http,
  provider,
  apm: apmOptions,
  silent,
  debug,

  // Arguments
  /// Conditionals
  onlyArtifacts,

  /// Context
  version,
  pathToPublish,
  contractAddress,
}) {
  const appName = module.appName
  return new TaskList(
    [
      {
        title: `Publish ${appName}`,
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) => {
          ctx.contractInstance = null // clean up deploy sub-command artifacts

          task.output = 'Generating transaction and waiting for confirmation'
          const accounts = await web3.eth.getAccounts()
          const from = accounts[0]

          const transaction = await apmPublishVersion(
            web3,
            from,
            appName,
            version,
            http ? 'http' : provider,
            http || pathToPublish,
            contractAddress,
            from,
            apmOptions
          )

          transaction.from = from
          transaction.gasPrice = gasPrice
          // apm.js already calculates the recommended gas

          ctx.receipt = await web3.eth.sendTransaction(transaction)
        },
      },
    ],
    listrOpts(silent, debug)
  )
}
