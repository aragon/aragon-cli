const TaskList = require('listr')
const Web3 = require('web3')
const daoArg = require('./utils/daoArg')
import initAragonJS from './utils/aragonjs-wrapper'
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const path = require('path')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')
const chalk = require('chalk')
const getRepoTask = require('./utils/getRepoTask')

const ANY_ENTITY = '0xffffffffffffffffffffffffffffffffffffffff'

exports.command = 'upgrade <dao> <apmRepo> [apmRepoVersion]'

exports.describe = 'Upgrade an app into a DAO'

exports.builder = function (yargs) {
  return getRepoTask.args(daoArg(yargs))
}

const getContract = (pkg, contract) => {
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}

exports.task = async ({ web3, reporter, dao, network, apmOptions, apmRepo, apmRepoVersion, repo }) => {
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  // TODO: Resolve DAO ens name

  const tasks = new TaskList([
    {
      title: `Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`,
      skip: ctx => ctx.repo, // only run if repo isn't passed
      task: getRepoTask.task({ apm, apmRepo, apmRepoVersion }),
    },
    {
      title: 'Upgrading app',
      task: async (ctx) => {
        const kernel = new web3.eth.Contract(
          getContract('@aragon/os', 'Kernel').abi,
          dao
        )

        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

        const basesNamespace = await kernel.methods.APP_BASES_NAMESPACE().call()

        const setApp = kernel.methods.setApp(basesNamespace, ctx.repo.appId, ctx.repo.contractAddress)
        
        return setApp.send({ from: ctx.accounts[0], gasLimit: 1e6 })
      }
    },
  ], { repo })

  return tasks
}

exports.handler = async function ({ reporter, dao, network, apm: apmOptions, apmRepo, apmRepoVersion }) {
  const web3 = await ensureWeb3(network)
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const task = await exports.task({ web3, reporter, dao, network, apmOptions, apmRepo, apmRepoVersion })
  return task.run()
    .then((ctx) => {
      reporter.success(`Upgraded ${apmRepo} to ${chalk.bold(ctx.repo.version)}`)
      process.exit()
    })
}