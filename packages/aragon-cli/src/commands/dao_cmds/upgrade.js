const execTask = require('./utils/execHandler').task
const { resolveEnsDomain } = require('./utils/aragonjs-wrapper')
const TaskList = require('listr')
const daoArg = require('./utils/daoArg')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')
const chalk = require('chalk')
const getRepoTask = require('./utils/getRepoTask')
const { getContract } = require('../../util')
const listrOpts = require('../../helpers/listr-options')

exports.command = 'upgrade <dao> <apmRepo> [apmRepoVersion]'

exports.describe = 'Upgrade an app into a DAO'

exports.builder = function(yargs) {
  return getRepoTask.args(daoArg(yargs))
}

exports.task = async ({
  wsProvider,
  web3,
  reporter,
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
        title: `Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`,
        skip: ctx => ctx.repo, // only run if repo isn't passed
        task: getRepoTask.task({ apm, apmRepo, apmRepoVersion }),
      },
      {
        title: 'Upgrading app',
        task: async ctx => {
          const kernel = new web3.eth.Contract(
            getContract('@aragon/os', 'Kernel').abi,
            dao
          )

          const basesNamespace = await kernel.methods
            .APP_BASES_NAMESPACE()
            .call()

          const getTransactionPath = wrapper => {
            const fnArgs = [
              basesNamespace,
              ctx.repo.appId,
              ctx.repo.contractAddress,
            ]
            return wrapper.getTransactionPath(dao, 'setApp', fnArgs)
          }

          return execTask(dao, getTransactionPath, {
            reporter,
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
      `Successfully executed: "${ctx.transactionPath[0].description}"`
    )
    process.exit()
  })
}
