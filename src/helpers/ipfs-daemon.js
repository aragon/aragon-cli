const { hasBin, isPortTaken } = require('../util')
const execa = require('execa')

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

module.exports = { isIPFSRunning, isIPFSInstalled, startIPFSDaemon }