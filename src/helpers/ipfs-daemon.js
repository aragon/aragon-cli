const { hasBin, isPortTaken } = require('../util')
const execa = require('execa')
const ipfsAPI = require('ipfs-api')

const isIPFSInstalled = async () => {
  return await hasBin('ipfs')
}

const startIPFSDaemon = async () => {
  return new Promise((resolve) => {
    const ipfsProc = execa('ipfs', ['daemon'])
    ipfsProc.stdout.on('data', (data) => {
      if (data.toString().includes('Daemon is ready')) resolve()
    })
  })
}

let ipfsNode

const IPFSCORS = [{
  key: 'API.HTTPHeaders.Access-Control-Allow-Origin',
  value: ["*"]
}, {
  key: 'API.HTTPHeaders.Access-Control-Allow-Methods',
  value: ["PUT", "GET", "POST"]
}]

const checkIPFSCORS = async (ipfsRpc) => {
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

module.exports = { isIPFSInstalled, startIPFSDaemon, checkIPFSCORS, setIPFSCORS }