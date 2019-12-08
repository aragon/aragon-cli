const TaskList = require('listr')
const APM = require('@aragon/apm')
const { bold, blue } = require('chalk')
const { getBasesNamespace } = require('@aragon/toolkit/dist/kernel/kernel')
const {
  resolveAddressOrEnsDomain,
} = require('@aragon/toolkit/dist/dao/utils/resolveAddressOrEnsDomain')
//
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const listrOpts = require('../../helpers/listr-options')
const defaultAPMName = require('../../helpers/default-apm')
const daoArg = require('./utils/daoArg')
const execTask = require('./utils/execHandler').task
const getRepoTask = require('./utils/getRepoTask')

exports.command = 'upgrade <dao> <apmRepo> [apmRepoVersion]'

exports.describe = 'Upgrade an app into a DAO'

exports.builder = function(yargs) {
  return getRepoTask.args(daoArg(yargs))
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
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  dao = await resolveAddressOrEnsDomain(dao, web3, apmOptions['ens-registry'])

  const tasks = new TaskList(
    [
      {
        title: `Fetching ${bold(apmRepo)}@${apmRepoVersion}`,
        skip: ctx => ctx.repo, // only run if repo isn't passed
        task: getRepoTask.task({ apm, apmRepo, apmRepoVersion }),
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
