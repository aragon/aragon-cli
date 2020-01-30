import TaskList from 'listr'
import { useApm, useEnvironment } from '@aragon/toolkit'
//
// import { task as execTask } from '../../commands/dao_cmds/utils/execHandler'
import listrOpts from '../../../helpers/listr-options'

export default async function runPublishTask ({
  // Globals
  // reporter,
  environment,
  http,
  provider,

  // Arguments
  /// Conditionals
  onlyArtifacts,

  /// Context
  version,
  pathToPublish,
  contractAddress,
  // dao,
  // proxyAddress,
  // methodName,
  // params,
  silent,
  debug,
}) {
  const { web3, gasPrice, appName } = useEnvironment(environment)
  // TODO: Move web3 logic inside toolkit

  const apm = await useApm(environment)

  return new TaskList(
    [
      // {
      //   // TODO: Use this task once we fix publish with intent
      //   title: `Publish ${appName}`,
      //   enabled: () => !onlyArtifacts,
      //   task: async (ctx, task) =>
      //     execTask({
      //       reporter,
      //       environment,
      //       dao,
      //       app: proxyAddress,
      //       method: methodName,
      //       params,
      //     }),
      // },
      {
        title: `Publish ${appName}`,
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) => {
          ctx.contractInstance = null // clean up deploy sub-command artifacts

          task.output = 'Generating transaction and waiting for confirmation'
          const accounts = await web3.eth.getAccounts()
          const from = accounts[0]

          const transaction = await apm.publishVersion(
            from,
            appName,
            version,
            http ? 'http' : provider,
            http || pathToPublish,
            contractAddress,
            from
          )

          transaction.from = from
          transaction.gasPrice = gasPrice
          // apm.js already calculates the recommended gas

          ctx.receipt = await web3.eth.sendTransaction(transaction)
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}
