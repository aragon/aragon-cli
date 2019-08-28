// import path from 'path'
import TaskList from 'listr'
// import chalk from 'chalk'
// import IPFS from 'ipfs-api'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
//
import {
  startDaemon,
  // isIPFSCORS,
  // setIPFSCORS as setCORS,
  // isIPFSRunning,
  getDefaultRepoPath,
  setPorts,
  // getClient,
} from '../lib'

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
      default: true,
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
        title: 'Configure ports',
        task: async () => {
          await setPorts(repoPath, apiPort, gatewayPort, swarmPort)
        },
      },
      {
        title: 'Start the daemon',
        task: async () => {
          await startDaemon(repoPath, { detached })
        },
      },
      // {
      //   title: 'Connect to the API',
      //   task: async (ctx) => {
      //     ctx.apiClient = await getClient(`http://localhost:${apiPort}`)
      //   },
      // },
      // {
      //   title: 'Configure CORS',
      //   task: async (ctx) => {
      //     await setCORS(ctx.apiClient)
      //   }
      // },
      // {
      // title: 'Pin the latest aragon artifacts',
      // task: ctx => {
      // await pinLatestArtifacts(ctx.apiClient)
      // const ipfs = IPFS('localhost', '5001', { protocol: 'http' })
      // const files = path.resolve(
      //   require.resolve('@aragon/aragen'),
      //   '../ipfs-cache'
      // )

      // return new Promise((resolve, reject) => {
      //   ipfs.util.addFromFs(
      //     files,
      //     { recursive: true, ignore: 'node_modules' },
      //     (err, files) => {
      //       if (err) return reject(err)
      //       resolve(files)
      //     }
      //   )
      // })
      // },
      // },
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
  } = argv

  await runStartTask({
    detached,
    apiPort,
    gatewayPort,
    swarmPort,
    silent,
    debug,
    repoPath,
  })

  // if (ctx.started) {
  //   reporter.info(
  //     'IPFS daemon is now running. Stopping this process will stop IPFS'
  //   )
  // } else {
  //   reporter.warning(chalk.yellow("Didn't start IPFS, port busy"))
  //   process.exit()
  // }
}
