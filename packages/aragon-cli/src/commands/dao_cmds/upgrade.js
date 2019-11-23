import { task as execTask } from './utils/execHandler'
import { resolveEnsDomain } from '../../helpers/aragonjs-wrapper'
import TaskList from 'listr'
import daoArg from './utils/daoArg'
import { ensureWeb3 } from '../../helpers/web3-fallback'
import APM from '@aragon/apm'
import defaultAPMName from '@aragon/cli-utils/src/helpers/default-apm'
import chalk from 'chalk'
import startIPFS from '../ipfs_cmds/start'
import getRepoTask from './utils/getRepoTask'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
import { abi as kernelAbi } from '@aragon/os/build/contracts/Kernel'

export const command = 'upgrade <dao> <apmRepo> [apmRepoVersion]'
export const describe = 'Upgrade an app into a DAO'

export const builder = function(yargs) {
  return getRepoTask.args(daoArg(yargs))
}

export const task = async ({
  wsProvider,
  web3,
  reporter,
  gasPrice,
  dao,
  network,
  apmOptions,
  apmRepo,
  apmRepoVersion,
  repo,
  silent,
  debug,
}) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  dao = /0x[a-fA-F0-9]{40}/.test(dao)
    ? dao
    : await resolveEnsDomain(dao, {
        provider: web3.currentProvider,
        registryAddress: apmOptions.ensRegistryAddress,
      })

  const tasks = new TaskList(
    [
      {
        // IPFS is a dependency of getRepoTask which uses IPFS to fetch the contract ABI
        title: 'Check IPFS',
        task: () => startIPFS.task({ apmOptions }),
      },
      {
        title: `Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`,
        skip: ctx => ctx.repo, // only run if repo isn't passed
        task: getRepoTask.task({ apm, apmRepo, apmRepoVersion }),
      },
      {
        title: 'Upgrading app',
        task: async ctx => {
          const kernel = new web3.eth.Contract(kernelAbi, dao)

          const basesNamespace = await kernel.methods
            .APP_BASES_NAMESPACE()
            .call()

          return execTask({
            dao,
            app: dao,
            method: 'setApp',
            params: [basesNamespace, ctx.repo.appId, ctx.repo.contractAddress],
            ipfsCheck: false,
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

  return tasks
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

  const tasks = await task({
    web3,
    reporter,
    dao,
    gasPrice,
    network,
    apmOptions,
    apmRepo,
    apmRepoVersion,
    wsProvider,
    silent,
    debug,
  })

  return tasks.run().then(ctx => {
    reporter.success(
      `Successfully executed: "${chalk.blue(
        ctx.transactionPath[0].description
      )}"`
    )
    process.exit()
  })
}
