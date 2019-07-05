import TaskList from 'listr'
import chalk from 'chalk'
import publicIp from 'public-ip'
import internalIp from 'internal-ip'
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
exports.describe = 'Summarize the status quo'

exports.builder = yargs => {
  return yargs
}

const runCheckTask = ({ silent, debug, local }) => {
  return new TaskList(
    [
      {
        title: 'Determine binary location',
        task: ctx => {
          ctx.ipfsBinPath = local
            ? getLocalBinary('ipfs', process.cwd())
            : getGlobalBinary('ipfs')

          if (ctx.ipfsBinPath === null) {
            throw new Error('IPFS is not installed')
          }
        },
      },
      {
        title: 'Determine repository location',
        task: ctx => {
          ctx.ipfsRepoPath = process.env.IPFS_PATH || getDefaultRepoPath()
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

exports.handler = async function({ debug, silent, skipConfirmation, local }) {
  const { ipfsBinPath, ipfsRepoPath } = await runCheckTask({
    silent,
    debug,
    local,
  })
  const ipfsRepoSize = await getRepoSize(ipfsRepoPath)
  const repoConfig = await getRepoConfig(ipfsRepoPath)
  const daemonRunning = await isDaemonRunning({
    protocol: 'http',
    host: '127.0.0.1',
    port: 5001,
  })
  const pubIP = await publicIp.v4()
  const internalIP = await internalIp.v4()
  const ports = getPortsConfig(repoConfig)

  const CORSconfigured = await isIPFSCORS({
    protocol: 'http',
    host: '127.0.0.1',
    port: 5001,
  })

  console.log(
    '\n',
    `Binary location: ${chalk.blue(ipfsBinPath)}`,
    '\n',
    `Repository location: ${chalk.blue(ipfsRepoPath)}`,
    '\n',
    `Repository version: ${chalk.blue(await getRepoVersion(ipfsRepoPath))}`,
    '\n',
    `Repository size: ${chalk.blue(ipfsRepoSize)}`,
    '\n',
    '\n',
    `PeerID: ${chalk.blue(chalk.bold(getPeerIDConfig(repoConfig)))}`,
    '\n',
    `Daemon: ${daemonRunning ? chalk.green('running') : chalk.red('stopped')}`,
    '\n',
    `CORS: ${CORSconfigured ? chalk.green('enabled') : chalk.red('disabled')}`,
    '\n',
    '\n',
    `API port: ${chalk.blue(ports.api)}`,
    '\n',
    `Gateway port: ${chalk.blue(ports.gateway)}`,
    '\n',
    `Swarm port: ${chalk.blue(ports.swarm)}`,
    '\n',
    '\n',
    `Public Swarm MultiAddress: ${chalk.blue(
      '/ip4/' + pubIP + '/tcp/4001/ipfs' + getPeerIDConfig(repoConfig)
    )}`,
    '\n',
    `Internal Swarm MultiAddress: ${chalk.blue(
      '/ip4/' + internalIP + '/tcp/4001/ipfs' + getPeerIDConfig(repoConfig)
    )}`,
    '\n',
    `Local Swarm MultiAddress: ${chalk.blue(
      '/ip4/' + '127.0.0.1' + '/tcp/4001/ipfs' + getPeerIDConfig(repoConfig)
    )}`,
    '\n',
    '\n'
  )

  // IPFS dist hash QmVsyZUnjBLk25KknDrhU8dJbVikLTVQYL8eJYt9PRyiDz
  // /ip4/94.59.14.17/tcp/4001/ipfs/QmRut6QXoDGunU7LnJ78QY3hSLkXrTGRPRJbdsLwbMYYws
  // Whether the gateway is open to the public ??
  // Whether the API is open to the public??
  // StorageMax + How much is used
  // CORS
}
