const killProcessOnPort = require('kill-port')

const IPFS_API_PORT = 5001
const DEVCHAIN_PORT = 8545

Promise.all([
  killProcessOnPort(IPFS_API_PORT),
  killProcessOnPort(DEVCHAIN_PORT),
])
  .then(() => {
    console.log(`Processes killed on ports: ${IPFS_API_PORT}, ${DEVCHAIN_PORT}`)
  })
  .catch(() => {
    console.log(
      `Cannot kill processes on ports: ${IPFS_API_PORT}, ${DEVCHAIN_PORT}}`
    )
  })
