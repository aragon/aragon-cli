const TaskList = require('listr')
const { green, bold } = require('chalk')
const getApmRepo = require('@aragon/toolkit/dist/apm/getApmRepo')
const newDao = require('@aragon/toolkit/dist/dao/new')
const { assignId } = require('@aragon/toolkit/dist/dao/assign-id')
//
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const listrOpts = require('../../helpers/listr-options')
const defaultAPMName = require('../../helpers/default-apm')
const { parseArgumentStringIfPossible } = require('../../util')

exports.BARE_TEMPLATE = defaultAPMName('bare-template')
exports.BARE_INSTANCE_FUNCTION = 'newInstance'
exports.BARE_TEMPLATE_DEPLOY_EVENT = 'DeployDao'

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
    .option('aragon-id', {
      description: 'Assign an Aragon Id to the DAO',
      type: 'string',
    })
}

// Task will be moved to handler once `dao start` is refactored
exports.task = async ({
  web3,
  gasPrice,
  apmOptions,
  template,
  templateVersion,
  fn,
  fnArgs,
  deployEvent,
  templateInstance,
  silent,
  debug,
  aragonId,
}) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  template = defaultAPMName(template)
  let repo, daoAddress

  const tasks = new TaskList(
    [
      {
        title: `Fetching template ${bold(template)}@${templateVersion}`,
        task: async () => {
          repo = await getApmRepo(web3, template, templateVersion, apmOptions)
        },
        enabled: () => !templateInstance,
      },
      {
        title: 'Create new DAO from template',
        task: async ctx => {
          daoAddress = await newDao({
            repo,
            web3,
            templateInstance,
            newInstanceMethod: fn,
            newInstanceArgs: fnArgs,
            deployEvent,
            gasPrice,
          })
          ctx.daoAddress = daoAddress
        },
      },
      {
        title: 'Assigning Aragon Id',
        enabled: () => aragonId,
        task: async () => {
          await assignId(daoAddress, aragonId, {
            web3,
            ensRegistry: apmOptions.ensRegistryAddress,
            gasPrice,
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
    aragonId,
    silent,
    debug,
  })
  const ctx = await task.run()

  reporter.success(
    aragonId
      ? `Created DAO: ${green(aragonId)} at ${green(ctx.daoAddress)}`
      : `Created DAO: ${green(ctx.daoAddress)}`
  )

  process.exit()
}
