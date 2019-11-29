import TaskList from 'listr'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
//
import {
  startDaemon,
  getDefaultRepoPath,
  setPorts,
  ensureIPFSInitialized,
  getClient,
  setIPFSCORS,
  pinArtifacts,
} from '../../lib/ipfs'

export const command = 'start'
export const describe = 'Start and configure the daemon.'

export const builder = yargs =>
  yargs
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
      alias: 'd',
      default: false,
      boolean: true,
    })

const runStartTask = ({
  detached,
  repoPath,
  apiPort,
  gatewayPort,
  swarmPort,
  silent,
  debug,
}) => {
  return new TaskList(
    [
      {
        title: 'Checking repository',
        task: async () => {
          await ensureIPFSInitialized(repoPath)
        },
      },
      {
        title: 'Configure ports',
        task: async ctx => {
          try {
            await setPorts(repoPath, apiPort, gatewayPort, swarmPort)
          } catch (e) {
            ctx.setPortsSuccess = false
          }
        },
      },
      {
        title: 'Start the daemon',
        task: async ctx => {
          ctx.processController = await startDaemon(repoPath, { detached })
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

export const handler = async argv => {
  const {
    detached,
    silent,
    debug,
    apiPort,
    gatewayPort,
    swarmPort,
    repoPath,
    reporter,
  } = argv

  const { processController } = await runStartTask({
    detached,
    apiPort,
    gatewayPort,
    swarmPort,
    silent,
    debug,
    repoPath,
  })

  reporter.info(`Daemon output:\n${processController.output}`)

  if (detached) {
    processController.detach()
    reporter.warning(`The IPFS Daemon will continue running in the background!
Use the 'aragon ipfs stop' command to stop it.`)
  } else {
    processController.attach()
    reporter.info(
      'Did you know you can run the IPFS Daemon in the background using the `-d` flag?'
    )
  }

  /**
   * Configure IPFS with Aragon-specific logic
   */
  const apiClient = await getClient(`http://localhost:${apiPort}`)
  await setIPFSCORS(apiClient)
  reporter.success('Successfully configured CORS')
  const hashes = await pinArtifacts(apiClient)
  reporter.success(`Successfully pinned ${hashes.length} Aragon artifacts.`)
}
