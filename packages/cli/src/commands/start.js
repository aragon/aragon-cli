import { blue } from 'chalk'
import TaskList from 'listr'
//
import {
  fetchClient,
  downloadClient,
  buildClient,
  startClient,
  openClient,
} from '../lib/start'

import {
  isLocalDaemonRunning,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
} from '@aragon/toolkit'

import pkg from '../../package.json'
import { installDeps } from '../util'
import listrOpts from '../helpers/listr-options'

const DEFAULT_CLIENT_REPO = pkg.aragon.clientRepo
const DEFAULT_CLIENT_VERSION = pkg.aragon.clientVersion
const DEFAULT_CLIENT_PORT = pkg.aragon.clientPort

export const command = 'start [client-repo] [client-version]'
export const describe = 'Start the Aragon GUI (graphical user interface)'

export const builder = yargs => {
  return yargs
    .positional('client-repo', {
      description:
        'Repo of Aragon client used to run your sandboxed app (valid git repository using https or ssh protocol)',
      default: DEFAULT_CLIENT_REPO,
    })
    .positional('client-version', {
      description:
        'Version of Aragon client used to run your sandboxed app (commit hash, branch name or tag name)',
      default: DEFAULT_CLIENT_VERSION,
    })
    .option('client-port', {
      description: 'Port being used by Aragon client',
      default: DEFAULT_CLIENT_PORT,
    })
    .option('client-path', {
      description: 'A path pointing to an existing Aragon client installation',
      default: null,
    })
    .option('auto-open', {
      description: 'Wether to automatically open the client in the browser',
      boolean: true,
      default: true,
    })
}

export const task = async function({
  clientRepo,
  clientVersion,
  clientPort,
  clientPath,
  autoOpen,
  silent,
  debug,
}) {
  const tasks = new TaskList(
    [
      {
        title: 'Fetching client from aragen',
        skip: () => !!clientPath,
        task: async (ctx, task) => {
          task.output = 'Fetching client...'
          await fetchClient(ctx, task, DEFAULT_CLIENT_VERSION)
        },
        enabled: () => clientVersion === DEFAULT_CLIENT_VERSION,
      },
      {
        title: 'Downloading client',
        skip: ctx => !!clientPath,
        task: async (ctx, task) => {
          task.output = 'Downloading client...'
          await downloadClient({ ctx, task, clientRepo, clientVersion })
        },
        enabled: ctx => !ctx.clientFetch,
      },
      {
        title: 'Installing client dependencies',
        task: async (ctx, task) => installDeps(ctx.clientPath, task),
        enabled: ctx => !ctx.clientAvailable && !clientPath,
      },
      {
        title: 'Building Aragon client',
        task: async (ctx, task) => {
          task.output = 'Building Aragon client...'
          await buildClient(ctx, clientPath)
        },
        enabled: ctx => !ctx.clientAvailable,
      },
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
        title: 'Starting Aragon client',
        task: async (ctx, task) => {
          task.output = 'Starting Aragon client...'
          await startClient(ctx, clientPort, clientPath)
        },
      },
      {
        title: 'Opening client',
        task: async (ctx, task) => {
          if (autoOpen === true) {
            task.output = 'Opening client'
            await openClient(ctx, clientPort)
          }
        },
      },
    ],
    listrOpts(silent, debug)
  )
  return tasks
}

export const handler = async ({
  reporter,
  clientRepo,
  clientVersion,
  clientPort,
  clientPath,
  autoOpen,
  silent,
  debug,
}) => {
  reporter.warning(
    'This command is deprecated and will be removed in a future release. Please see the Aragon Buidler plugin for an improved development experience: https://github.com/aragon/buidler-aragon'
  )

  const tasks = await task({
    clientRepo,
    clientVersion,
    clientPort,
    clientPath,
    autoOpen,
    silent,
    debug,
  })

  await tasks.run()

  reporter.info(
    `Aragon client from ${blue(clientRepo)} version ${blue(
      clientVersion
    )} started on port ${blue(clientPort)}`
  )

  // Patch to prevent calling the onFinishCommand hook
  await new Promise((resolve, reject) => {})
}
