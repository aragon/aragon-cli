const TaskList = require('listr')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('@aragon/cli-utils/src/helpers/default-apm')
const { green, bold } = require('chalk')
const getRepoTask = require('./utils/getRepoTask')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const startIPFS = require('../ipfs_cmds/start')
const {
  getRecommendedGasLimit,
  parseArgumentStringIfPossible,
} = require('../../util')
const kernelAbi = require('@aragon/os/build/contracts/Kernel').abi
const assignIdTask = require('./id-assign').task

exports.BARE_TEMPLATE = defaultAPMName('bare-template')
exports.BARE_INSTANCE_FUNCTION = 'newInstance'
exports.BARE_TEMPLATE_DEPLOY_EVENT = 'DeployDao'

const BARE_TEMPLATE_ABI = require('./utils/bare-template-abi')

exports.command = 'new [template] [template-version]'

exports.describe = 'Create a new DAO'

exports.builder = yargs => {
  return yargs
    .positional('template', {
      description: 'Name of the template to use creating the DAO',
      default: exports.BARE_TEMPLATE,
    })
    .positional('template-version', {
      description: 'Version of the template to be used',
      default: 'latest',
    })
    .option('fn-args', {
      description:
        'Arguments to be passed to the newInstance function (or the function passed with --fn)',
      array: true,
      default: [],
      coerce: args => {
        return args.map(parseArgumentStringIfPossible)
      },
    })
    .option('fn', {
      description: 'Function to be called to create instance',
      default: exports.BARE_INSTANCE_FUNCTION,
    })
    .option('deploy-event', {
      description: 'Event name that the template will fire on success',
      default: exports.BARE_TEMPLATE_DEPLOY_EVENT,
    })
    .option('ipfs-check', {
      description: 'Whether to have new start IPFS if not started',
      boolean: true,
      default: true,
    })
    .option('aragon-id', {
      description: 'Assign an Aragon Id to the DAO',
      type: 'string',
    })
}

exports.task = async ({
  web3,
  reporter,
  gasPrice,
  apmOptions,
  template,
  templateVersion,
  fn,
  fnArgs,
  skipChecks,
  deployEvent,
  templateInstance,
  silent,
  debug,
  ipfsCheck,
  aragonId,
}) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  template = defaultAPMName(template)

  const tasks = new TaskList(
    [
      {
        // IPFS is a dependency of getRepoTask which uses IPFS to fetch the contract ABI
        title: 'Check IPFS',
        task: () => startIPFS.handler({ apmOptions }),
        enabled: () => ipfsCheck,
      },
      {
        title: `Fetching template ${bold(template)}@${templateVersion}`,
        task: getRepoTask.task({
          apm,
          apmRepo: template,
          apmRepoVersion: templateVersion,
          artifactRequired: false,
        }),
        enabled: () => !templateInstance,
      },
      {
        title: 'Create new DAO from template',
        task: async (ctx, task) => {
          if (!ctx.accounts) {
            ctx.accounts = await web3.eth.getAccounts()
          }
          const abi = ctx.repo.abi || BARE_TEMPLATE_ABI
          const template =
            templateInstance ||
            new web3.eth.Contract(abi, ctx.repo.contractAddress)

          const newInstanceTx = template.methods[fn](...fnArgs)
          const estimatedGas = await newInstanceTx.estimateGas()
          const { events } = await newInstanceTx.send({
            from: ctx.accounts[0],
            gas: await getRecommendedGasLimit(web3, estimatedGas),
            gasPrice,
          })

          const deployEventValue =
            events[deployEvent] ||
            // Some templates use DeployDAO instead of DeployDao
            events.DeployDAO

          if (deployEventValue)
            ctx.daoAddress = deployEventValue.returnValues.dao
          else {
            reporter.error(`Could not find deploy event: ${deployEvent}`)
            process.exit(1)
          }
        },
      },
      {
        title: 'Checking DAO',
        skip: () => skipChecks,
        task: async (ctx, task) => {
          const kernel = new web3.eth.Contract(kernelAbi, ctx.daoAddress)
          ctx.aclAddress = await kernel.methods.acl().call()
          ctx.appManagerRole = await kernel.methods.APP_MANAGER_ROLE().call()
        },
      },
      {
        title: 'Assigning Aragon Id',
        enabled: () => aragonId,
        task: async ctx => {
          return assignIdTask({
            dao: ctx.daoAddress,
            aragonId,
            web3,
            gasPrice,
            apmOptions,
            silent,
            debug,
            reporter,
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
  network,
  template,
  templateVersion,
  fn,
  fnArgs,
  deployEvent,
  apm: apmOptions,
  aragonId,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)

  const task = await exports.task({
    web3,
    reporter,
    network,
    apmOptions,
    template,
    templateVersion,
    fn,
    fnArgs,
    deployEvent,
    skipChecks: false,
    aragonId,
    silent,
    debug,
  })
  return task.run().then(ctx => {
    if (aragonId) {
      reporter.success(
        `Created DAO: ${green(ctx.domain)} at ${green(ctx.daoAddress)}`
      )
    } else {
      reporter.success(`Created DAO: ${green(ctx.daoAddress)}`)
    }

    process.exit()
  })
}
