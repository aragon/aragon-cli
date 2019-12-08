import {
  copyClient,
  getClientPath,
  existsClientPath,
  downloadClient,
  buildClient,
  startClient,
  openClient,
} from '../lib/start'

const { blue } = require('chalk')
const TaskList = require('listr')
//
const pkg = require('../../package.json')
const { installDepsWithoutTask: installDeps, isPortTaken } = require('../util')

const DEFAULT_CLIENT_REPO = pkg.aragon.clientRepo
const DEFAULT_CLIENT_VERSION = pkg.aragon.clientVersion
const DEFAULT_CLIENT_PORT = pkg.aragon.clientPort

exports.command = 'start [client-repo] [client-version]'

exports.describe = 'Start the Aragon GUI (graphical user interface)'

exports.builder = yargs => {
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
}

/**
 * This task is used by run.js:391:11 as
 * start.task({ clientRepo, clientVersion, clientPort, clientPath })
 */
exports.task = function({
  clientRepo,
  clientVersion,
  clientPort,
  clientPath: existingClientPath,
}) {
  const computedClientPath = getClientPath(clientVersion)
  const computedClientPathExists = existsClientPath(computedClientPath)
  const shouldInstallClient = !computedClientPathExists
  const useAragenClient = clientVersion === DEFAULT_CLIENT_VERSION
  // Target client path = provided / existing / downloaded / copied client path
  const clientPath = existingClientPath || computedClientPath

  const tasks = new TaskList([
    /**
     * [Fetching]
     * Always
     * ctx.clientFetch = true
     * ctx.clientAvailable = true
     * ctx.clientPath = `${os.homedir()}/.aragon/client-${clientVersion}`
     *
     * Skips if
     * existsSync(path.resolve(`${os.homedir()}/.aragon/client-${clientVersion}`))
     *
     * Copies the client files from disk when the version is the defaults
     */
    // {
    //   title: 'Fetching client from aragen',
    //   task: async (ctx, task) => {
    //     task.output = 'Fetching client...'
    //     await fetchClient(ctx, task, DEFAULT_CLIENT_VERSION)
    //   },
    //   enabled: () => clientVersion === DEFAULT_CLIENT_VERSION,
    // },
    /**
     * [Downloading]
     * If the previous fetching happen, clientFetch === true and this
     * will not be enabled
     *
     * Always
     * ctx.clientPath = `${os.homedir()}/.aragon/client-${clientVersion}`
     * ctx.clientAvailable = true
     *
     * Skips if
     * existsSync(path.resolve(`${os.homedir()}/.aragon/client-${clientVersion}`))
     *
     * It 'git clone's the repo at the request version
     */
    {
      title: useAragenClient ? 'Copy client' : 'Download client',
      task: async () =>
        useAragenClient
          ? copyClient(computedClientPath)
          : downloadClient({
              clientPath: computedClientPath,
              clientRepo,
              clientVersion,
            }),
      enabled: () => shouldInstallClient,
    },
    /**
     * When is clientAvailable not true? What does it mean?
     * Why is ctx.clientPath used? It is only set in a code block that
     * sets ctx.clientAvailable = true, so it won't be set
     *
     * #### Question, the aragen client files have to be built?
     */
    {
      title: 'Installing client dependencies',
      task: (_0, task) =>
        installDeps(computedClientPath, log => (task.output = log)),
      enabled: () => shouldInstallClient,
    },
    /**
     * Runs npm run build:local
     *
     * #### Question, the aragen client files have to be built?
     */
    {
      title: 'Building Aragon client',
      task: () => buildClient(computedClientPath),
      enabled: () => shouldInstallClient,
    },
    /**
     * If port is taken
     * ctx.portOpen = true  - [NOTE] run.js:404:9 uses ctx.portOpen.
     * and the task is skipped
     *
     * Executes an http-server serving the client content
     */
    {
      title: 'Starting Aragon client',
      task: async (ctx, task) => {
        task.output = 'Starting Aragon client...'
        if (await isPortTaken(clientPort)) {
          ctx.portOpen = true
        } else {
          await startClient(clientPort, clientPath)
        }
      },
    },
    /**
     * Opens a browser window
     * #### Question: Where is `ctx.daoAddress` set, or coming from?
     */
    {
      title: 'Opening client',
      task: async (ctx, task) => {
        task.output = 'Opening client'
        await openClient(clientPort, ctx.daoAddress)
      },
    },
  ])
  return tasks
}

exports.handler = async ({
  reporter,
  clientRepo,
  clientVersion,
  clientPort,
  clientPath,
}) => {
  const task = exports.task({
    clientRepo,
    clientVersion,
    clientPort,
    clientPath,
  })

  await task.run()

  reporter.info(
    `Aragon client from ${blue(clientRepo)} version ${blue(
      clientVersion
    )} started on port ${blue(clientPort)}`
  )
}
