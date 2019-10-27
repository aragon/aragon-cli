const execTask = require('./utils/execHandler').task
const { resolveEnsDomain } = require('../../helpers/aragonjs-wrapper')
const TaskList = require('listr')
const daoArg = require('./utils/daoArg')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('@aragon/cli-utils/src/helpers/default-apm')
const chalk = require('chalk')
const startIPFS = require('../ipfs_cmds/start')
const getRepoTask = require('./utils/getRepoTask')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')

exports.command = 'upgrade <dao> <apmRepo> [apmRepoVersion]'

exports.describe = 'Upgrade an app into a DAO'

exports.builder = function(yargs) {
  return getRepoTask.args(daoArg(yargs))
}

exports.task = async ({
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
          const kernel = new web3.eth.Contract(
            require('./abi/os/Kernel').abi,
            dao
          )

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

exports.handler = async function({
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

  const task = await exports.task({
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

  return task.run().then(ctx => {
    reporter.success(
      `Successfully executed: "${chalk.blue(
        ctx.transactionPath[0].description
      )}"`
    )
    process.exit()
  })
}
