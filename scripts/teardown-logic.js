const { killProcessOnPort } = require('../packages/toolkit')

const IPFS_API_PORT = 5001
const DEVCHAIN_PORT = 8545
const FRAME_PORT = 1248

const LOGGER_PREFIX = '[cli-monorepo:posttest]'

const logger = (...messages) => {
  console.log(LOGGER_PREFIX, ...messages)
}

module.exports = function() {
  Promise.all([
    killProcessOnPort(IPFS_API_PORT),
    killProcessOnPort(DEVCHAIN_PORT),
    killProcessOnPort(FRAME_PORT),
  ])
    .then(() => {
      logger(`Processes killed on ports: ${IPFS_API_PORT}, ${DEVCHAIN_PORT}, ${FRAME_PORT}`)
    })
    .catch(() => {
      logger(
        `Cannot kill processes on ports: ${IPFS_API_PORT}, ${DEVCHAIN_PORT}, ${FRAME_PORT}}`
      )
    })
}
