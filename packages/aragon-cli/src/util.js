const findUp = require('find-up')
const path = require('path')
const execa = require('execa')
const fs = require('fs')
const { readJson } = require('fs-extra')
const which = require('which')
const { request } = require('http')
const net = require('net')
const inquirer = require('inquirer')

let cachedProjectRoot

const PGK_MANAGER_BIN_NPM = 'npm'
const debugLogger = process.env.DEBUG ? console.log : () => {}

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

const isPortTaken = async (port, opts) => {
  opts = Object.assign({ timeout: 1000 }, opts)

  return new Promise(resolve => {
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
  })
}

/**
 * Check if an http server is listening at a given url
 * @param {string} url Server url
 * @returns {boolean} true if server is returning a valid response
 */
function isHttpServerOpen(url) {
  return new Promise(resolve => {
    request(url, { method: 'HEAD' }, r => {
      resolve(r.statusCode >= 200 && r.statusCode < 400)
    })
      .on('error', () => resolve(false))
      .end()
  })
}

const getNodePackageManager = () => {
  return PGK_MANAGER_BIN_NPM
}

const installDeps = (cwd, task) => {
  return installDepsWithoutTask(cwd, log => {
    task.output = log
  })
}

/**
 * Runs npm install on a directory
 * @param {string} cwd cwd
 * @param {(log: string) => void} [logger] Callback to receive updates from
 * @return {Promise<void>}
 * the installation process
 */
const installDepsWithoutTask = (cwd, logger) => {
  const bin = getNodePackageManager()
  const installProcess = execa(bin, ['install'], { cwd })
  installProcess.stdout.on('data', log => {
    if (log && logger) logger(log)
  })
  return installProcess.catch(err => {
    throw new Error(
      `${err.message}\n${err.stderr}\n\nFailed to install dependencies. See above output.`
    )
  })
}

/**
 * Attempts to find the binary path locally and then globally.
 *
 * @param {string} binaryName e.g.: `ipfs`
 * @returns {string} the path to the binary, `null` if unsuccessful
 */
const getBinary = binaryName => {
  let binaryPath = getLocalBinary(binaryName)

  if (binaryPath === null) {
    binaryPath = getGlobalBinary(binaryName)
  }

  if (binaryPath === null) {
    debugLogger(`Cannot find binary ${binaryName}.`)
  } else {
    debugLogger(`Found binary ${binaryName} at ${binaryPath}.`)
  }

  return binaryPath
}

const getLocalBinary = (binaryName, projectRoot) => {
  if (!projectRoot) {
    // __dirname evaluates to the directory of this file (util.js)
    // e.g.: `../dist/` or `../src/`
    projectRoot = path.join(__dirname, '..')
  }

  // check local node_modules
  let binaryPath = path.join(projectRoot, 'node_modules', '.bin', binaryName)

  debugLogger(`Searching binary ${binaryName} at ${binaryPath}`)
  if (fs.existsSync(binaryPath)) {
    return binaryPath
  }

  // check parent node_modules
  binaryPath = path.join(projectRoot, '..', '.bin', binaryName)

  debugLogger(`Searching binary ${binaryName} at ${binaryPath}.`)
  if (fs.existsSync(binaryPath)) {
    return binaryPath
  }

  // check parent node_modules if this module is scoped (e.g.: @scope/package)
  binaryPath = path.join(projectRoot, '..', '..', '.bin', binaryName)

  debugLogger(`Searching binary ${binaryName} at ${binaryPath}.`)
  if (fs.existsSync(binaryPath)) {
    return binaryPath
  }

  return null
}

const getGlobalBinary = binaryName => {
  debugLogger(`Searching binary ${binaryName} in the global PATH variable.`)

  try {
    return which.sync(binaryName)
  } catch {
    return null
  }
}

// TODO: Add a cwd paramter
const runScriptTask = async (task, scriptName) => {
  if (!fs.existsSync('package.json')) {
    task.skip('No package.json found')
    return
  }

  const packageJson = await readJson('package.json')
  const scripts = packageJson.scripts || {}
  if (!scripts[scriptName]) {
    task.skip(`${scriptName} script not defined in package.json`)
    return
  }

  const bin = getNodePackageManager()
  const scriptTask = execa(bin, ['run', scriptName])

  scriptTask.stdout.on('data', log => {
    if (!log) return
    task.output = `npm run ${scriptName}: ${log}`
  })

  return scriptTask.catch(err => {
    throw new Error(
      `${err.message}\n${err.stderr}\n\nFailed to build. See above output.`
    )
  })
}

/**
 * Parse a String to Boolean, or throw an error.
 *
 * The check is **case insensitive**! (Passing `"TRue"` will return `true`)
 *
 * @param {string} target must be a string
 * @returns {boolean} the parsed value
 */
const parseAsBoolean = target => {
  if (typeof target !== 'string') {
    throw new Error(
      `Expected ${target} to be of type string, not ${typeof target}`
    )
  }

  const lowercase = target.toLowerCase()

  if (lowercase === 'true') {
    return true
  }

  if (lowercase === 'false') {
    return false
  }

  throw new Error(`Cannot parse ${target} as boolean`)
}

/**
 * Parse a String to Array, or throw an error.
 *
 * @param {string} target must be a string
 * @returns {Array} the parsed value
 */
const parseAsArray = target => {
  if (typeof target !== 'string') {
    throw new Error(
      `Expected ${target} to be of type string, not ${typeof target}`
    )
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
  const json = JSON.parse(target)

  if (Array.isArray(json)) {
    return json
  }

  throw new Error(`Cannot parse ${target} as array`)
}

/**
 * Parse a String to Boolean or Array, or throw an error.
 *
 * @param {string} target must be a string
 * @returns {boolean|Array} the parsed value
 */
const parseArgumentStringIfPossible = target => {
  // convert to boolean: 'false' to false
  try {
    return parseAsBoolean(target)
  } catch (e) {}

  // convert to array: '["hello", 1, "true"]' to ["hello", 1, "true"]
  // TODO convert children as well ??
  try {
    return parseAsArray(target)
  } catch (e) {}

  // nothing to parse
  return target
}

const askForInput = async message => {
  const { reply } = await inquirer.prompt([
    {
      type: 'input',
      name: 'reply',
      message,
    },
  ])
  return reply
}

const askForChoice = async (message, choices) => {
  const { reply } = await inquirer.prompt([
    {
      type: 'list',
      name: 'reply',
      message,
      choices,
    },
  ])
  return reply
}

const askForConfirmation = async message => {
  const { reply } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'reply',
      message,
    },
  ])
  return reply
}

module.exports = {
  parseArgumentStringIfPossible,
  debugLogger,
  findProjectRoot,
  isHttpServerOpen,
  isPortTaken,
  installDeps,
  installDepsWithoutTask,
  runScriptTask,
  getNodePackageManager,
  getBinary,
  getLocalBinary,
  getGlobalBinary,
  askForInput,
  askForChoice,
  askForConfirmation,
}
