import path from 'path'

export async function fetchClient(clientPath, progressCallback) {

// Make sure we haven't already downloaded the client
if (existsSync(path.resolve(clientPath))) {
  progressCallback(2)
  return
}

// Get prebuild client from aragen
const files = path.resolve(
  require.resolve('@aragon/aragen'),
  '../ipfs-cache',
  '@aragon/aragon'
)

// Ensure folder exists
const BUILD_PATH = path.join(clientPath, 'build')
ensureDirSync(BUILD_PATH)
