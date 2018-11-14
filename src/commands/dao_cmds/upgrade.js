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

exports.builder = function (yargs) {
  return getRepoTask.args(daoArg(yargs))
}

exports.task = async ({ web3, reporter, dao, network, apmOptions, apmRepo, apmRepoVersion, repo, silent, debug }) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  // TODO: Resolve DAO ens name

  const tasks = new TaskList([
    {
      title: `Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`,
      skip: ctx => ctx.repo, // only run if repo isn't passed
      task: getRepoTask.task({ apm, apmRepo, apmRepoVersion })
    },
    {
      title: 'Upgrading app',
      task: async (ctx) => {
        const kernel = new web3.eth.Contract(
          getContract('@aragon/os', 'Kernel').abi,
          dao
        )

        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

        const basesNamespace = await kernel.methods.APP_BASES_NAMESPACE().call()

        const setApp = kernel.methods.setApp(basesNamespace, ctx.repo.appId, ctx.repo.contractAddress)

        return setApp.send({ from: ctx.accounts[0], gasLimit: 1e6 })
      }
    }
  ],
    listrOpts(silent, debug)
  )

  return tasks
}

exports.handler = async function ({ reporter, dao, network, apm: apmOptions, apmRepo, apmRepoVersion, silent, debug }) {
  const web3 = await ensureWeb3(network)
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const task = await exports.task({ web3, reporter, dao, network, apmOptions, apmRepo, apmRepoVersion, silent, debug })
  return task.run()
    .then((ctx) => {
      reporter.success(`Upgraded ${apmRepo} to ${chalk.bold(ctx.repo.version)}`)
      process.exit()
    })
}
