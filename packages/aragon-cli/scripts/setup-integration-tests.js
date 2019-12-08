const execa = require('execa')
const { existsSync } = require('fs-extra')
//
const { initPackage } = require('../dist/lib/node/packages')

/**
 * Setup
 */

const IPFS_API_PORT = 5001
const IPFS_GATEWAY_PORT = 8080
const IPFS_SWARM_PORT = 4001
const DEVCHAIN_PORT = 8545

// const IPFS_API_PORT = 1630
// const IPFS_GATEWAY_PORT = 1601
// const IPFS_SWARM_PORT = 1602
// const DEVCHAIN_PORT = 1605

const ipfsProjectPath = './.tmp/setup/ipfs-project'
const ipfsBinPath = './.tmp/setup/ipfs-project/node_modules/.bin/ipfs'
const ipfsRepoPath = './.tmp/setup/ipfs-repo'

/**
 * Utilities =============================================================
 */

const runAragonCLI = (args, opts) =>
  execa('node', ['dist/cli.js', ...args], {
    stdout: process.stdout,
    stderr: process.stderr,
    stdin: process.stdin,
    ...opts,
  })

/**
 * IPFS =============================================================
 */

const ensureIpfsInstallation = () => {
  initPackage(ipfsProjectPath)

  if (existsSync(`${ipfsProjectPath}/node_modules/.bin/ipfs`))
    return Promise.resolve()

  return runAragonCLI([
    'ipfs',
    'install',
    '--local',
    '--project-path',
    ipfsProjectPath,
    '--skip-confirmation',
  ])
}

const startIpfs = () =>
  runAragonCLI([
    'ipfs',
    'start',
    '--detached',
    '--repo-path',
    ipfsRepoPath,
    '--bin-path',
    ipfsBinPath,
    '--api-port',
    IPFS_API_PORT,
    '--swarm-port',
    IPFS_SWARM_PORT,
    '--gateway-port',
    IPFS_GATEWAY_PORT,
  ])

ensureIpfsInstallation()
  .then(() => {
    console.log('✔✔✔ IPFS installed, starting the Daemon')

    return startIpfs()
  })
  .then(() => {
    console.log('✔✔✔ IPFS Daemon started')
  })
  .catch(() => {
    console.error('✖✖✖ Cannot install/start IPFS. Is it already started?')
  })

/**
 * Ganache =============================================================
 */

// execa('npx', ['ganache-cli'], {
const startDevchain = () => runAragonCLI(['devchain', '--port', DEVCHAIN_PORT])

// TODO: run devchain as a background process
startDevchain()
  .then(() => {
    console.log('✔✔✔ Devchain started')
  })
  .catch(() => {
    console.log('✖✖✖ Devchain stopped or could not be started')
  })
