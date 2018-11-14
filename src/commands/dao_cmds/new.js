const TaskList = require('listr')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')
const chalk = require('chalk')
const { getContract } = require('../../util')
const getRepoTask = require('./utils/getRepoTask')
const listrOpts = require('../../helpers/listr-options')

exports.BARE_KIT = defaultAPMName('bare-kit')
exports.BARE_INSTANCE_FUNCTION = 'newBareInstance'
exports.BARE_KIT_DEPLOY_EVENT = 'DeployInstance'

const BARE_KIT_ABI = require('./utils/bare-kit-abi')

exports.command = 'new [kit] [kit-version]'

exports.describe = 'Create a new DAO'

exports.builder = yargs => {
  return yargs.positional('kit', {
    description: 'Name of the kit to use creating the DAO',
    default: exports.BARE_KIT
  })
    .positional('kit-version', {
      description: 'Version of the kit to be used',
      default: 'latest'
    })
    .option('fn-args', {
      description: 'Arguments to be passed to the newInstance function (or the function passed with --fn)',
      array: true,
      default: []
    })
    .option('fn', {
      description: 'Function to be called to create instance',
      default: exports.BARE_INSTANCE_FUNCTION
    })
    .option('deploy-event', {
      description: 'Event name that the kit will fire on success',
      default: exports.BARE_KIT_DEPLOY_EVENT
    })
}

exports.task = async ({ web3, reporter, apmOptions, kit, kitVersion, fn, fnArgs, skipChecks, deployEvent, kitInstance, silent, debug }) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  kit = defaultAPMName(kit)

  const tasks = new TaskList([
    {
      title: `Fetching kit ${chalk.bold(kit)}@${kitVersion}`,
      task: getRepoTask.task({ apm, apmRepo: kit, apmRepoVersion: kitVersion, artifactRequired: false }),
      enabled: () => !kitInstance
    },
    {
      title: 'Create new DAO from kit',
      task: async (ctx, task) => {
        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

        // TODO: Remove hack once https://github.com/aragon/aragen/pull/15 is finished and published
        const abi = ctx.repo.abi || BARE_KIT_ABI
        const kit = kitInstance || new web3.eth.Contract(abi, ctx.repo.contractAddress)
        const newInstanceTx = kit.methods[fn](...fnArgs)

        const { events } = await newInstanceTx.send({ from: ctx.accounts[0], gas: 15e6 })
        ctx.daoAddress = events[deployEvent].returnValues.dao
      }
    },
    {
      title: 'Checking DAO',
      skip: () => skipChecks,
      task: async (ctx, task) => {
        const kernel = new web3.eth.Contract(
          getContract('@aragon/os', 'Kernel').abi, ctx.daoAddress
        )
        ctx.aclAddress = await kernel.methods.acl().call()
        ctx.appManagerRole = await kernel.methods.APP_MANAGER_ROLE().call()
      }
    }
  ],
    listrOpts(silent, debug)
  )

  return tasks
}

exports.handler = async function ({ reporter, network, kit, kitVersion, fn, fnArgs, deployEvent, apm: apmOptions, silent, debug }) {
  const web3 = await ensureWeb3(network)

  const task = await exports.task({ web3, reporter, network, apmOptions, kit, kitVersion, fn, fnArgs, deployEvent, skipChecks: false, silent, debug })
  return task.run()
    .then((ctx) => {
      reporter.success(`Created DAO: ${chalk.bold(ctx.daoAddress)}`)

      process.exit()
    })
}
