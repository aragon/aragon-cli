const net = require('net')
const { hasBin } = require('../util')
const execa = require('execa')

const isPortTaken = async (port) => {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
    .once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true)
      } else {
        resolve(false)
      }
    })
    .once('listening', function() {
      tester.once('close', () => resolve(false)).close()
    })
    .listen(port)
  })
}

const isIPFSRunning = async () => {
  return await isPortTaken(5001)
}

const isIPFSInstalled = async () => {
  return await hasBin('ipfs')
}

const startIPFSDaemon = async () => {
  // Sometimes IPFS node takes too long to start and the CLI fails to connect
  return new Promise((resolve) => {
    const ipfsProc = execa('ipfs', ['daemon'])
    ipfsProc.stdout.on('data', (data) => {
      if (data.toString().includes('Daemon is ready')) resolve()
    })
  })
}

module.exports = { isIPFSRunning, isIPFSInstalled, startIPFSDaemon }