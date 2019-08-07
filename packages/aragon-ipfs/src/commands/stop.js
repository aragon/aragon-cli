import TaskList from 'listr'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
import killProcessOnPort from 'kill-port'
//
import { getDefaultRepoPath, getPorts, getRepoConfig, getClient } from '../lib'

export const command = 'stop'
export const describe = 'Stop the daemon.'

export const builder = yargs =>
  yargs.option('repo-path', {
    description: 'The location of the IPFS repository',
    default: getDefaultRepoPath(),
  })

const runStartTask = ({ repoPath, silent, debug }) => {
  return new TaskList(
    [
      {
        title: 'Find ports',
        task: async ctx => {
          ctx.repo = await getRepoConfig(repoPath)
          ctx.ports = await getPorts(ctx.repo)
        },
      },
      {
        title: 'Check ports',
        task: async ctx => {
          try {
            // isPortTaken
            await getClient(`http://localhost:${ctx.ports.api}`)
          } catch (err) {
            throw new Error('The IPFS Daemon is already stopped')
          }
        },
      },
      {
        title: 'Kill the process',
        task: async ctx => {
          await killProcessOnPort(ctx.ports.api)
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

export const handler = async argv => {
  const { reporter, silent, debug, repoPath } = argv
  await runStartTask({ silent, debug, repoPath })
  reporter.success('The IPFS Daemon stopped successfully')
}
