const { hasBin, isPortTaken } = require('../util')
const execa = require('execa')
const ipfsAPI = require('ipfs-api')

const isIPFSRunning = async () => {
  return await isPortTaken(5001)
}

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

const setIPFSCORS = async () => {
  const ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'})
  await ipfs.config.set('API.HTTPHeaders.Access-Control-Allow-Origin', ["*"])
  await ipfs.config.set('API.HTTPHeaders.Access-Control-Allow-Methods', ["PUT", "GET", "POST"])
}

const ensureIPFS = async () => {
  const running = await isIPFSRunning()
  if (!running) {
    await startIPFSDaemon()
  }
  await setIPFSCORS()
  return true
}

module.exports = { isIPFSRunning, isIPFSInstalled, startIPFSDaemon, setIPFSCORS }