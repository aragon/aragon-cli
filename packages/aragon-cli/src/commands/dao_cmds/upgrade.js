import TaskList from 'listr'
import APM from '@aragon/apm'
import { bold, blue } from 'chalk'
import { getBasesNamespace } from '@aragon/toolkit/dist/kernel/kernel'
import { resolveAddressOrEnsDomain } from '@aragon/toolkit/dist/dao/utils/resolveAddressOrEnsDomain'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

import listrOpts from '../../helpers/listr-options'
import defaultAPMName from '../../helpers/default-apm'
import daoArg from './utils/daoArg'
import { task as execTask } from './utils/execHandler'
import { getRepoTask, getRepoBuilder } from './utils/getRepoTask'

export const command = 'upgrade <dao> <apmRepo> [apmRepoVersion]'
export const describe = 'Upgrade an app into a DAO'

export const builder = function(yargs) {
  return getRepoBuilder(daoArg(yargs))
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

  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  dao = await resolveAddressOrEnsDomain(dao, web3, apmOptions['ens-registry'])

  const tasks = new TaskList(
    [
      {
        title: `Fetching ${bold(apmRepo)}@${apmRepoVersion}`,
        skip: ctx => ctx.repo, // only run if repo isn't passed
        task: getRepoTask({ apm, apmRepo, apmRepoVersion }),
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
    reporter.success(
      `Successfully executed: "${blue(ctx.transactionPath[0].description)}"`
    )
    process.exit()
  })
}
