import TaskList from 'listr'
import { bold, blue } from 'chalk'
import {
  getBasesNamespace,
  resolveAddressOrEnsDomain,
  defaultAPMName,
  getApmRepo,
} from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'
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

  const apmRepoName = defaultAPMName(apmRepo)

  dao = await resolveAddressOrEnsDomain(
    dao,
    web3,
    apmOptions.ensRegistryAddress
  )

  const tasks = new TaskList(
    [
      {
        title: `Fetching ${bold(apmRepoName)}@${apmRepoVersion}`,
        skip: ctx => ctx.repo, // only run if repo isn't passed
        task: async ctx => {
          const progressHandler = step => {
            switch (step) {
              case 1:
                console.log(`Initialize aragonPM`)
                break
              case 2:
                console.log(`Fetching...`)
                break
            }
          }

          ctx.repo = await getApmRepo(
            web3,
            apmRepoName,
            apmRepoVersion,
            apmOptions,
            progressHandler
          )
        },
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
