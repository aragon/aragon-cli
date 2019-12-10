import TaskList from 'listr'
//
import listrOpts from '../../helpers/listr-options'
//
import {
  startLocalDaemon,
  getDefaultRepoPath,
  setPorts,
  ensureRepoInitialized,
  getHttpClient,
  configureCors,
  pinArtifacts,
  getBinaryPath,
} from '../../lib/ipfs'

export const command = 'start'
export const describe = 'Start and configure the daemon.'

const DETACH_ALIAS = 'D'

export const builder = yargs =>
  yargs
    .option('bin-path', {
      description: 'The location of the IPFS binary',
      default: getBinaryPath(),
    })
    .option('repo-path', {
      description: 'The location of the IPFS repository',
      default: getDefaultRepoPath(),
    })
    .option('api-port', {
      default: 5001,
    })
    .option('gateway-port', {
      // todo number:true
      default: 8080,
    })
    .option('swarm-port', {
      default: 4001,
    })
    .option('detached', {
      description: 'Whether to run the daemon in the background',
      // uppercase D to avoid conflicting with --debug
      alias: DETACH_ALIAS,
      default: false,
      boolean: true,
    })

const runStartTask = ({
  binPath,
  repoPath,
  apiPort,
  gatewayPort,
  swarmPort,
  detached,
  silent,
  debug,
}) => {
  return new TaskList(
    [
      {
        title: 'Checking repository',
        task: async () => {
          await ensureRepoInitialized(binPath, repoPath)
        },
      },
      {
        title: 'Configure ports',
        task: async () => {
          await setPorts(repoPath, apiPort, gatewayPort, swarmPort)
        },
      },
      {
        title: 'Start the daemon',
        task: async ctx => {
          ctx.processController = await startLocalDaemon(binPath, repoPath, {
            detached,
          })
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

export const handler = async argv => {
  const {
    binPath,
    repoPath,
    apiPort,
    gatewayPort,
    swarmPort,
    detached,
    silent,
    debug,
    reporter,
  } = argv

  const { processController } = await runStartTask({
    binPath,
    repoPath,
    apiPort,
    gatewayPort,
    swarmPort,
    detached,
    silent,
    debug,
  })

  if (!detached) {
    processController.attach()
    reporter.info(
      `Did you know you can run the IPFS Daemon in the background using the '-${DETACH_ALIAS}' option?`
    )
  }

  // if (detached && !processController) {
  //   reporter.warning('The IPFS Daemon is already running on these ports!')
  //   reporter.warning('Trying to connect to the existing process...')
  // }

  if (detached) {
    processController.detach()
    reporter.info(`Daemon output:\n${processController.output}`)
    reporter.warning(`The IPFS Daemon will continue running in the background!
Use the 'aragon ipfs stop' command to stop it.`)
  }

  /**
   * Configure IPFS with Aragon-specific logic
   */
  const httpClient = await getHttpClient(`http://localhost:${apiPort}`)
  await configureCors(httpClient)
  reporter.success('Successfully configured CORS')
  const hashes = await pinArtifacts(httpClient)
  reporter.success(`Successfully pinned ${hashes.length} Aragon artifacts.`)
}
