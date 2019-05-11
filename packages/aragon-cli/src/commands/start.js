import { downloadWrapper, startClient, openWrapper } from '../lib/start'
const TaskList = require('listr')
const chalk = require('chalk')
const pkg = require('../../package.json')
const { installDeps } = require('../util')

const isAddress = addr => /0x[a-fA-F0-9]{40}/.test(addr)
const isValidAragonID = dao => /[a-z0-9]+\.eth/.test(dao)

const DEFAULT_CLIENT_VERSION = pkg.aragon.clientVersion
const DEFAULT_CLIENT_PORT = pkg.aragon.clientPort

exports.command = 'start [dao]'

exports.describe = 'Start the Aragon GUI (graphical user interface)'

exports.builder = yargs => {
  return yargs
    .positional('dao', {
      description: 'Address of the Kernel or AragonID',
      coerce: dao =>
        dao != null && !isAddress(dao) && !isValidAragonID(dao)
          ? `${dao}.aragonid.eth` // append aragonid.eth if needed
          : dao,
      default: null,
    })
    .option('client-version', {
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

exports.task = async function({ dao, clientVersion, clientPort, clientPath }) {
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
        // TODO: Add environments (e.g. rinkeby)
        task.output = 'Opening wrapper'
        await openWrapper(dao, clientPort)
      },
    },
  ])
  return tasks
}

exports.handler = async ({
  reporter,
  dao,
  clientVersion,
  clientPort,
  clientPath,
}) => {
  const task = await exports.task({
    dao,
    clientVersion,
    clientPort,
    clientPath,
  })
  return task.run().then(() => {
    reporter.info(`Starting...
    ${dao ? chalk.bold('DAO') + ': ' + dao : ''}
    ${
      clientVersion ? chalk.bold('Client Version') : chalk.bold('Client Path')
    }: ${clientVersion || clientPath}
    ${chalk.bold(`Client Port`)}: ${clientPort}
    `)
  })
}
