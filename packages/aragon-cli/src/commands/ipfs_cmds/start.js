import TaskList from 'listr'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
//
import {
  startDaemon,
  getDefaultRepoPath,
  setPorts,
  ensureRepoInitialized,
  getClient,
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
          ctx.processController = await startDaemon(binPath, repoPath, {
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
      `Did you know you can run the IPFS Daemon in the background using the '${DETACH_ALIAS}' flag?`
    )
  }

  // if (detached && !processController) {
  //   reporter.warning('The IPFS Daemon is already running on these ports!')
  //   reporter.warning('Trying to connect to the existing process...')
  // }

  if (detached) {
    reporter.info(`Daemon output:\n${processController.output}`)
    processController.detach()
    reporter.warning('The IPFS Daemon will continue running in the background!')
    reporter.warning('Use the `aragon ipfs stop` command to stop it.')
  }

  /**
   * Configure IPFS with Aragon-specific logic
   */
  const apiClient = await getClient(`http://localhost:${apiPort}`)
  await configureCors(apiClient)
  reporter.success('Successfully configured CORS')
  const hashes = await pinArtifacts(apiClient)
  reporter.success(`Successfully pinned ${hashes.length} Aragon artifacts.`)
}
