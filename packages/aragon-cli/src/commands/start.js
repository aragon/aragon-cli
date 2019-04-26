import { downloadWrapper, startClient, openWrapper } from '../lib/start'
const TaskList = require('listr')
const pkg = require('../../package.json')
const { installDeps } = require('../util')

const DEFAULT_CLIENT_VERSION = pkg.aragon.clientVersion
const DEFAULT_CLIENT_PORT = pkg.aragon.clientPort

exports.command = 'start'

exports.describe = 'Open DAO'

exports.builder = yargs => {
  return yargs
    .option('client-version', {
      description: 'Version of Aragon client used to run your sandboxed app',
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
      title: 'Downloading wrapper',
      skip: () => !!clientPath,
      task: async (ctx, task) => {
        task.output = 'Downloading wrapper...'
        await downloadWrapper(ctx, task, clientVersion)
      },
    },
    {
      title: 'Installing wrapper dependencies',
      task: async (ctx, task) => installDeps(ctx.wrapperPath, task),
      enabled: ctx => !ctx.wrapperAvailable && !clientPath,
    },
    {
      title: 'Starting Aragon client',
      task: async (ctx, task) => {
        task.output = 'Starting Aragon client...'
        await startClient(ctx, clientPort, clientPath)
      },
    },
    {
      title: 'Opening wrapper',
      task: async (ctx, task) => {
        task.output = 'Opening wrapper'
        await openWrapper(ctx, clientPort)
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
  clientPort = clientPort || DEFAULT_CLIENT_PORT
  clientVersion = clientVersion || DEFAULT_CLIENT_VERSION
  const task = await exports.task({ clientVersion, clientPort, clientPath })
  return task
    .run()
    .then(() =>
      reporter.info(
        `Aragon client opened with wrapper version ${clientVersion}`
      )
    )
}
