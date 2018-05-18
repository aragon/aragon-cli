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
      throw new Error('This directory is not an Aragon project')
      // process.exit(1)
    }
  }
  return cachedProjectRoot
}

const hasBin = (bin) => new Promise((resolve, reject) => hasbin(bin, resolve))

const isPortTaken = async (port, opts) => {
  opts = Object.assign({timeout: 1000}, opts)

  return new Promise((resolve => {
    const socket = new net.Socket()

    const onError = () => {
      socket.destroy()
      resolve(false)
    }

    socket.setTimeout(opts.timeout)
    socket.on('error', onError)
    socket.on('timeout', onError)

    socket.connect(port, opts.host, () => {
      socket.end()
      resolve(true)
    })
  }))
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

const getContract = (pkg, contract) => {
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}

const ANY_ENTITY = '0xffffffffffffffffffffffffffffffffffffffff'

module.exports = { findProjectRoot, hasBin, isPortTaken, installDeps, getNodePackageManager, getContract, ANY_ENTITY }
