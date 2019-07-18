import TaskList from 'listr'
import chalk from 'chalk'
import publicIp from 'public-ip'
import internalIp from 'internal-ip'
import { existsSync } from 'fs'
//
import listrOpts from '../../helpers/listr-options'
import { getGlobalBinary, getLocalBinary } from '../../util'
import {
  getRepoVersion,
  getDefaultRepoPath,
  getRepoConfig,
  getPortsConfig,
  getPeerIDConfig,
  isDaemonRunning,
  getRepoSize,
} from '../../lib/ipfs'
import { isIPFSCORS } from '../../helpers/ipfs-daemon'

exports.command = 'status'
exports.describe = 'Status of the IPFS installation & daemon.'

exports.builder = yargs => {
  return yargs.option('repo-path', {
    description: 'The location of the IPFS repository',
    default: getDefaultRepoPath(),
  })
}

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
          ctx.daemonPorts = getPortsConfig(config)
        },
      },
      {
        title: 'Check the daemon',
        skip: ctx => !ctx.repoExists,
        task: async ctx => {
          ctx.daemonRunning = await isDaemonRunning({
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
          ctx.corsEnabled = await isIPFSCORS({
            protocol: 'http',
            host: '127.0.0.1',
            port: ctx.daemonPorts.api,
          })
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

exports.handler = async function({ reporter, debug, silent, repoPath }) {
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

  reporter.info(
    `Local installation: ${chalk.blue(localBinPath || 'not installed')}`
  )
  reporter.info(
    `Global installation: ${chalk.blue(globalBinPath || 'not installed')}`
  )

  reporter.newLine()
  if (repoExists) {
    reporter.info(`Repository location: ${chalk.blue(repoPath)}`)
    reporter.info(`Repository version: ${chalk.blue(repoVersion)}`)
    reporter.info(`Repository size: ${chalk.blue(repoSize)}`)
    reporter.newLine()
    reporter.info(`PeerID: ${chalk.bgWhite(chalk.black(peerID))}`)
    reporter.info(
      `Daemon: ${daemonRunning ? chalk.green('running') : chalk.red('stopped')}`
    )
  } else {
    reporter.info(`Repository: ${chalk.red('uninitialized')}`)
  }

  if (daemonRunning) {
    reporter.info(
      `CORS: ${corsEnabled ? chalk.green('enabled') : chalk.red('disabled')}`
    )
    reporter.newLine()
    reporter.info(`API port: ${chalk.blue(daemonPorts.api)}`)
    reporter.info(`Gateway port: ${chalk.blue(daemonPorts.gateway)}`)
    reporter.info(`Swarm port: ${chalk.blue(daemonPorts.swarm)}`)
    reporter.newLine()
    reporter.info(
      `Public Swarm MultiAddress: ${chalk.blue(publicSwarmMultiAddr)}`
    )
    reporter.info(
      `Internal Swarm MultiAddress: ${chalk.blue(internalSwarmMultiAddr)}`
    )
    reporter.info(
      `Local Swarm MultiAddress: ${chalk.blue(localSwarmMultiAddr)}`
    )
  }
}
