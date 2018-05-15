const findUp = require('find-up')
const path = require('path')
const hasbin = require('hasbin')
const { promisify } = require('util')
const execa = require('execa')
const net = require('net')

let cachedProjectRoot

const findProjectRoot = () => {
  if (!cachedProjectRoot) {
    cachedProjectRoot = path.dirname(findUp.sync('arapp.json'))
  }
  return cachedProjectRoot
}

const hasBin = (bin) => new Promise((resolve, reject) => hasbin(bin, resolve))

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

const installDeps = async (cwd) => {
  const hasYarn = await hasBin('yarn')
  const bin = (hasYarn) ? 'yarn' : 'npm'
  try {
    return execa(bin, ['install'], { cwd })
  } catch (_) {
    throw new Error('Could not install dependencies')
  }
}

module.exports = { findProjectRoot, hasBin, isPortTaken, installDeps }
