import TaskList from 'listr'
import { bold, blue } from 'chalk'
import {
  getBasesNamespace,
  resolveDaoAddressOrEnsDomain,
  getDefaultApmName,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
  isLocalDaemonRunning,
  getApmRepo,
} from '@aragon/toolkit'
//
import listrOpts from '../../helpers/listr-options'
import daoArg from './utils/daoArg'
import { task as execTask } from './utils/execHandler'

export const command = 'upgrade <dao> <apmRepo> [apmRepoVersion]'
export const describe = 'Upgrade an app into a DAO'

export const builder = function(yargs) {
  return daoArg(yargs)
    .option('apmRepo', {
      describe: 'Name of the aragonPM repo',
    })
    .option('apmRepoVersion', {
      describe: 'Version of the package upgrading to',
      default: 'latest',
    })
}

export const handler = async function({
  reporter,
  environment,
  dao,
  apmRepo,
  apmRepoVersion,
  silent,
  debug,
}) {
  const apmRepoName = getDefaultApmName(apmRepo)

  dao = await resolveDaoAddressOrEnsDomain(dao, environment)

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
        title: `Fetching ${bold(apmRepoName)}@${apmRepoVersion}`,
        skip: ctx => ctx.repo, // only run if repo isn't passed
        task: async ctx => {
          ctx.repo = await getApmRepo(apmRepoName, apmRepoVersion, environment)
        },
      },
      {
        title: 'Upgrading app',
        task: async ctx => {
          const basesNamespace = await getBasesNamespace(dao, environment)

          return execTask({
            reporter,
            environment,
            dao,
            app: dao,
            method: 'setApp',
            params: [basesNamespace, ctx.repo.appId, ctx.repo.contractAddress],
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
