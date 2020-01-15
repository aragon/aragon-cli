import TaskList from 'listr'
import { green, bold } from 'chalk'
import {
  getApmRepo,
  newDao,
  assignId,
  defaultAPMName,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
  isLocalDaemonRunning,
} from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'
import listrOpts from '../../helpers/listr-options'
import { parseArgumentStringIfPossible } from '../../util'

export const BARE_TEMPLATE = defaultAPMName('bare-template')
export const BARE_INSTANCE_FUNCTION = 'newInstance'
export const BARE_TEMPLATE_DEPLOY_EVENT = 'DeployDao'
export const command = 'new [template] [template-version]'
export const describe = 'Create a new DAO'

export const builder = yargs => {
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
export const task = async ({
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
  template = defaultAPMName(template)
  let repo, daoAddress

  const tasks = new TaskList(
    [
      {
        title: 'Start IPFS',
        skip: async () => isLocalDaemonRunning(),
        task: async () => {
          await startLocalDaemon(getBinaryPath(), getDefaultRepoPath(), {
            detached: false,
          })
        },
      },
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

export const handler = async function({
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

  const tasks = await task({
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
  const ctx = await tasks.run()

  reporter.newLine()
  reporter.success(
    aragonId
      ? `Created DAO: ${green(aragonId)} at ${green(ctx.daoAddress)}`
      : `Created DAO: ${green(ctx.daoAddress)}`
  )
}
