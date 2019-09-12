import {
  fetchClient,
  downloadClient,
  buildClient,
  startClient,
  openClient,
} from '../lib/start'
const chalk = require('chalk')
const TaskList = require('listr')
const pkg = require('../../package.json')
const { installDeps } = require('../util')

const DEFAULT_CLIENT_VERSION = pkg.aragon.clientVersion
const DEFAULT_CLIENT_PORT = pkg.aragon.clientPort

exports.command = 'start [client-version]'

exports.describe = 'Start the Aragon GUI (graphical user interface)'

exports.builder = yargs => {
  return yargs
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
}

exports.task = async function({ clientVersion, clientPort, clientPath }) {
  const tasks = new TaskList([
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
        await downloadClient(ctx, task, clientVersion)
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
      title: 'Starting Aragon client',
      task: async (ctx, task) => {
        task.output = 'Starting Aragon client...'
        await startClient(ctx, clientPort, clientPath)
      },
    },
    {
      title: 'Opening client',
      task: async (ctx, task) => {
        task.output = 'Opening client'
        await openClient(ctx, clientPort)
      },
    },
  ])
  return tasks
}

exports.handler = async ({
  reporter,
  clientVersion,
  clientPort,
  clientPath,
}) => {
  const task = await exports.task({ clientVersion, clientPort, clientPath })
  return task
    .run()
    .then(() =>
      reporter.info(
        `Aragon client version ${chalk.blue(
          clientVersion
        )}, started on port ${chalk.blue(clientPort)}`
      )
    )
}
