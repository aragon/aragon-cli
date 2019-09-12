const TaskList = require('listr')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('@aragon/cli-utils/src/helpers/default-apm')
const chalk = require('chalk')
const { getContract } = require('../../util')
const getRepoTask = require('./utils/getRepoTask')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const startIPFS = require('../ipfs_cmds/start')
const { getRecommendedGasLimit } = require('../../util')

exports.BARE_TEMPLATE = defaultAPMName('bare-template')
exports.BARE_INSTANCE_FUNCTION = 'newInstance'
exports.BARE_TEMPLATE_DEPLOY_EVENT = 'DeployDao'

exports.OLD_BARE_TEMPLATE = defaultAPMName('bare-kit')
exports.OLD_BARE_INSTANCE_FUNCTION = 'newBareInstance'
exports.OLD_BARE_TEMPLATE_DEPLOY_EVENT = 'DeployInstance'

// TODO: Remove old template once is no longer supported
const BARE_TEMPLATE_ABI = require('./utils/bare-template-abi')
const OLD_BARE_TEMPLATE_ABI = require('./utils/old-bare-template-abi')

exports.command = 'new [template] [template-version]'

exports.describe = 'Create a new DAO'

exports.builder = yargs => {
  return yargs
    .positional('kit', {
      description: 'Name of the kit to use creating the DAO',
    })
    .positional('kit-version', {
      description: 'Version of the kit to be used',
    })
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
}

exports.task = async ({
  web3,
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
}) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  template = defaultAPMName(template)

  let bareTemplateABI = BARE_TEMPLATE_ABI

  // Get chain id
  const chainId = await web3.eth.net.getId()

  // TODO: Remove rinkeby once new template deployed
  if ([1, 4].includes(chainId) && template === exports.BARE_TEMPLATE) {
    template = exports.OLD_BARE_TEMPLATE
    fn = exports.OLD_BARE_INSTANCE_FUNCTION
    deployEvent = exports.OLD_BARE_TEMPLATE_DEPLOY_EVENT
    bareTemplateABI = OLD_BARE_TEMPLATE_ABI
  }

  const tasks = new TaskList(
    [
      {
        // IPFS is a dependency of getRepoTask which uses IPFS to fetch the contract ABI
        title: 'Check IPFS',
        task: () => startIPFS.task({ apmOptions }),
        enabled: () => ipfsCheck,
      },
      {
        title: `Fetching template ${chalk.bold(template)}@${templateVersion}`,
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
          const abi = ctx.repo.abi || bareTemplateABI
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
          ctx.daoAddress = events[deployEvent].returnValues.dao
        },
      },
      {
        title: 'Checking DAO',
        skip: () => skipChecks,
        task: async (ctx, task) => {
          const kernel = new web3.eth.Contract(
            getContract('@aragon/os', 'Kernel').abi,
            ctx.daoAddress
          )
          ctx.aclAddress = await kernel.methods.acl().call()
          ctx.appManagerRole = await kernel.methods.APP_MANAGER_ROLE().call()
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
  kit,
  kitVersion,
  template,
  templateVersion,
  fn,
  fnArgs,
  deployEvent,
  apm: apmOptions,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)

  // TODO: this can be cleaned up once kits is no longer supported
  template = kit || template
  templateVersion = kitVersion || templateVersion

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
    silent,
    debug,
  })
  return task.run().then(ctx => {
    reporter.success(`Created DAO: ${chalk.green(ctx.daoAddress)}`)
    if (kit || kitVersion) {
      reporter.warning(
        `The use of kits is deprecated and templates should be used instead. The new options for 'dao new' are '--template' and '--template-version'`
      )
    }

    process.exit()
  })
}
