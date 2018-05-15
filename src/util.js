const findUp = require('find-up')
const path = require('path')
const hasbin = require('hasbin')
const { promisify } = require('util')
const execa = require('execa')
const net = require('net')

let cachedProjectRoot
let cachedNodePackageManager

const findProjectRoot = () => {
  if (!cachedProjectRoot) {
    try {
      cachedProjectRoot = path.dirname(findUp.sync('arapp.json'))
    } catch (_) {
      console.error('This directory is not an Aragon project')
      process.exit(1)
    }
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

const getNodePackageManager = async () => {
  if (!cachedNodePackageManager) {
    const hasYarn = await hasBin('yarn')
    cachedNodePackageManager = (hasYarn) ? 'yarn' : 'npm'
  }
  return cachedNodePackageManager
}

const installDeps = async (cwd, task) => {
  const bin = await getNodePackageManager()
  const installTask = execa(bin, ['install'], { cwd })
  installTask.stdout.on('data', (log) => {
    if (!log) return
    task.output = log
  })

  return installTask.catch((err) => {
    throw new Error(`${err.message}\n${err.stderr}\n\nFailed to install dependencies. See above output.`)
  })
}

module.exports = { findProjectRoot, hasBin, isPortTaken, installDeps, getNodePackageManager }
