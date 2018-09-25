const execa = require('execa')
const fs = require('fs')
const path = require('path')
const os = require('os')
const ipfsAPI = require('ipfs-api')
const { getNPMBinary } = require('../util')

const ipfsBin = getNPMBinary('go-ipfs', 'bin/ipfs')

const ensureIPFSInitialized = async () => {
  if (!fs.existsSync(path.join(os.homedir(), '.ipfs'))) {
    await execa(ipfsBin, ['init'])
  }
}

const startIPFSDaemon = () => (
  new Promise(async (resolve) => {
    await ensureIPFSInitialized()
    const ipfsProc = execa(ipfsBin, ['daemon'])
    ipfsProc.stdout.on('data', (data) => {
      if (data.toString().includes('Daemon is ready')) resolve()
    })
  })
)

let ipfsNode

const IPFSCORS = [{
  key: 'API.HTTPHeaders.Access-Control-Allow-Origin',
  value: ["*"]
}, {
  key: 'API.HTTPHeaders.Access-Control-Allow-Methods',
  value: ["PUT", "GET", "POST"]
}]

const isIPFSCORS = async (ipfsRpc) => {
  if (!ipfsNode) ipfsNode = ipfsAPI(ipfsRpc)
  const conf = await ipfsNode.config.get('API.HTTPHeaders')
  const allowOrigin = IPFSCORS[0].key.split('.').pop()
  const allowMethods = IPFSCORS[1].key.split('.').pop()
  if (conf && conf[allowOrigin] && conf[allowMethods]) {
    return true
  } else {
    throw new Error(`Please set the following flags in your IPFS node:
    ${IPFSCORS.map(({ key, value }) => {
      return `${key}: ${value}`
    }).join('\n    ')}`)
    process.exit()
  }
}

const setIPFSCORS = (ipfsRpc) => {
  if (!ipfsNode) ipfsNode = ipfsAPI(ipfsRpc)
  return Promise.all(
    IPFSCORS.map(({ key, value }) =>
      ipfsNode.config.set(key, value))
  )
}

module.exports = { startIPFSDaemon, isIPFSCORS, setIPFSCORS }