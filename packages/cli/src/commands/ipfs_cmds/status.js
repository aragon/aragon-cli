import TaskList from 'listr'
import publicIp from 'public-ip'
import internalIp from 'internal-ip'
import { existsSync } from 'fs'
import { black, bgWhite, blue, green, red } from 'chalk'
import {
  getRepoVersion,
  getDefaultRepoPath,
  getRepoConfig,
  getPorts,
  getPeerIDConfig,
  isLocalDaemonRunning,
  getRepoSize,
  isCorsConfigured,
  getGlobalBinary,
  getLocalBinary,
} from '@aragon/toolkit'
//
import listrOpts from '../../helpers/listr-options'

export const command = 'status'
export const describe =
  'Show whether the daemon is running and other useful information.'

export const builder = yargs =>
  yargs.option('repo-path', {
    description: 'The location of the IPFS repo',
    default: getDefaultRepoPath(),
  })

const runCheckTask = ({ silent, debug, repoPath }) => {
  return new TaskList(
    [
      {
        title: 'Check installations',
        task: ctx => {
          ctx.localBinPath = getLocalBinary('ipfs', process.cwd())
          ctx.globalBinPath = getGlobalBinary('ipfs')
        },
      },
      {
        title: 'Check repository',
        task: async ctx => {
          ctx.repoExists = existsSync(repoPath)
          if (!ctx.repoExists) return

          const [version, size, config] = await Promise.all([
            getRepoVersion(repoPath),
            getRepoSize(repoPath),
            getRepoConfig(repoPath),
          ])

          ctx.repoVersion = version
          ctx.repoSize = size
          ctx.peerID = getPeerIDConfig(config)
          ctx.daemonPorts = getPorts(config)
        },
      },
      {
        title: 'Check the daemon',
        skip: ctx => !ctx.repoExists,
        task: async ctx => {
          ctx.daemonRunning = await isLocalDaemonRunning({
            protocol: 'http',
            host: '127.0.0.1',
            port: ctx.daemonPorts.api,
          })
        },
      },
      {
        title: 'Check CORS',
        skip: ctx => !ctx.daemonRunning,
        task: async ctx => {
          try {
            ctx.corsEnabled = await isCorsConfigured({
              protocol: 'http',
              host: '127.0.0.1',
              port: ctx.daemonPorts.api,
            })
          } catch (err) {}
        },
      },
      {
        title: 'Check MultiAddresses',
        skip: ctx => !ctx.daemonRunning,
        task: async ctx => {
          const [publicIP, internalIP] = await Promise.all([
            publicIp.v4(),
            internalIp.v4(),
          ])

          ctx.publicSwarmMultiAddr =
            '/ip4/' + publicIP + '/tcp/4001/ipfs' + ctx.peerID
          ctx.internalSwarmMultiAddr =
            '/ip4/' + internalIP + '/tcp/4001/ipfs' + ctx.peerID
          ctx.localSwarmMultiAddr =
            '/ip4/' + '127.0.0.1' + '/tcp/4001/ipfs' + ctx.peerID
        },
      },
      // Other possible checks:
      // Whether the gateway is open to the public ??
      // Whether the API is open to the public??
      // StorageMax
    ],
    listrOpts(silent, debug)
  ).run()
}

export const handler = async argv => {
  const { reporter, debug, silent, repoPath } = argv

  const {
    localBinPath,
    globalBinPath,
    repoVersion,
    repoSize,
    peerID,
    daemonPorts,
    daemonRunning,
    corsEnabled,
    publicSwarmMultiAddr,
    internalSwarmMultiAddr,
    localSwarmMultiAddr,
    repoExists,
  } = await runCheckTask({
    silent,
    debug,
    repoPath,
  })

  reporter.info(`Local installation: ${blue(localBinPath || 'not installed')}`)
  reporter.info(
    `Global installation: ${blue(globalBinPath || 'not installed')}`
  )

  reporter.newLine()
  if (repoExists) {
    reporter.info(`Repository location: ${blue(repoPath)}`)
    reporter.info(`Repository version: ${blue(repoVersion)}`)
    reporter.info(`Repository size: ${blue(repoSize)}`)
    reporter.newLine()
    reporter.info(`API port: ${blue(daemonPorts.api)}`)
    reporter.info(`Gateway port: ${blue(daemonPorts.gateway)}`)
    reporter.info(`Swarm port: ${blue(daemonPorts.swarm)}`)
    reporter.newLine()
    reporter.info(`PeerID: ${bgWhite(black(peerID))}`)
    reporter.info(
      `Daemon: ${daemonRunning ? green('running') : red('stopped')}`
    )
  } else {
    reporter.info(`Repository: ${red('uninitialized')}`)
  }

  if (daemonRunning) {
    reporter.info(`CORS: ${corsEnabled ? green('enabled') : red('disabled')}`)
    reporter.newLine()
    reporter.info(`Public Swarm MultiAddress: ${blue(publicSwarmMultiAddr)}`)
    reporter.info(
      `Internal Swarm MultiAddress: ${blue(internalSwarmMultiAddr)}`
    )
    reporter.info(`Local Swarm MultiAddress: ${blue(localSwarmMultiAddr)}`)
  }
}
