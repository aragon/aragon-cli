import TaskList from 'listr'
import { green } from 'chalk'
import {
  newDao,
  assignDaoId,
  getDefaultApmName,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
  isLocalDaemonRunning,
} from '@aragon/toolkit'
//
import listrOpts from '../../helpers/listr-options'
import { parseArgumentStringIfPossible } from '../../util'

export const BARE_TEMPLATE = getDefaultApmName('bare-template')
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
  environment,
  template,
  templateVersion,
  fn,
  fnArgs,
  deployEvent,
  templateInstance,
  aragonId,
  silent,
  debug,
}) => {
  template = getDefaultApmName(template)
  let daoAddress

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
        title: 'Create new DAO from template',
        task: async ctx => {
          daoAddress = await newDao(
            template,
            fnArgs,
            fn,
            deployEvent,
            templateVersion,
            environment,
            templateInstance
          )
          ctx.daoAddress = daoAddress
        },
      },
      {
        title: 'Assigning Aragon Id',
        enabled: () => aragonId,
        task: async () => {
          await assignDaoId(daoAddress, aragonId, environment)
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
}

export const handler = async function({
  reporter,
  environment,
  template,
  templateVersion,
  fn,
  fnArgs,
  deployEvent,
  aragonId,
  silent,
  debug,
}) {
  const tasks = await task({
    reporter,
    environment,
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
