import TaskList from 'listr'
import APM from '@aragon/apm'
import { bold, blue } from 'chalk'
import {
  getBasesNamespace,
  resolveAddressOrEnsDomain,
  defaultAPMName,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
  isLocalDaemonRunning,
} from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'
import listrOpts from '../../helpers/listr-options'
import daoArg from './utils/daoArg'
import { task as execTask } from './utils/execHandler'
import { task as getRepoTask, args } from './utils/getRepoTask'

export const command = 'upgrade <dao> <apmRepo> [apmRepoVersion]'
export const describe = 'Upgrade an app into a DAO'

export const builder = function(yargs) {
  return args(daoArg(yargs))
}

export const handler = async function({
  reporter,
  dao,
  gasPrice,
  network,
  wsProvider,
  apm: apmOptions,
  apmRepo,
  apmRepoVersion,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)

  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  dao = await resolveAddressOrEnsDomain(
    dao,
    web3,
    apmOptions.ensRegistryAddress
  )

  const tasks = new TaskList(
    [
      {
        title: 'Start IPFS',
        skip: async () => isLocalDaemonRunning(),
        task: async () => {
          await startLocalDaemon(getBinaryPath(), getDefaultRepoPath(), {
            detached: false,
          })
        },
      },
      {
        title: `Fetching ${bold(apmRepo)}@${apmRepoVersion}`,
        skip: ctx => ctx.repo, // only run if repo isn't passed
        task: async (ctx, task) =>
          getRepoTask({ apm, apmRepo, apmRepoVersion }),
      },
      {
        title: 'Upgrading app',
        task: async ctx => {
          const basesNamespace = await getBasesNamespace(dao, web3)

          return execTask({
            dao,
            app: dao,
            method: 'setApp',
            params: [basesNamespace, ctx.repo.appId, ctx.repo.contractAddress],
            reporter,
            gasPrice,
            apm: apmOptions,
            web3,
            wsProvider,
          })
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks.run().then(ctx => {
    reporter.newLine()
    reporter.success(
      `Successfully executed: "${blue(ctx.transactionPath.description)}"`
    )
  })
}
