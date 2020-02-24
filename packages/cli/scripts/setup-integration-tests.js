const { ensureLocalDaemon } = require('../dist/lib/ipfs')
const { ensureDevchain } = require('../dist/helpers/ensureDevchain')

const LOGGER_PREFIX = '[cli-monorepo:pretest]'

const IPFS_API_PORT = 5001
const IPFS_GATEWAY_PORT = 8080
const IPFS_SWARM_PORT = 4001
const DEVCHAIN_PORT = 8545

// BEWARE: packages share the same pretest setup
const IPFS_PROJECT_PATH = './.tmp/setup/ipfs-project'
const IPFS_BIN_PATH = './.tmp/setup/ipfs-project/node_modules/.bin/ipfs'
const IPFS_REPO_PATH = './.tmp/setup/ipfs-repo'

const logger = (...messages) => {
  console.log(LOGGER_PREFIX, ...messages)
}

ensureLocalDaemon({
  projectPath: IPFS_PROJECT_PATH,
  binPath: IPFS_BIN_PATH,
  repoPath: IPFS_REPO_PATH,
  apiPort: IPFS_API_PORT,
  gatewayPort: IPFS_GATEWAY_PORT,
  swarmPort: IPFS_SWARM_PORT,
  logger,
})

ensureDevchain({
  port: DEVCHAIN_PORT,
  logger,
})
