const findUp = require('find-up')
const path = require('path')
const net = require('net')
const fs = require('fs')
const { readJson } = require('fs-extra')
const which = require('which')
const inquirer = require('inquirer')
const execa = require('execa')
const psTree = require('ps-tree')

const askForInput = async message => {
  const { reply } = await inquirer.prompt([{
    type: 'input',
    name: 'reply',
    message
  }])
  return reply
}

const askForChoice = async (message, choices) => {
  const { reply } = await inquirer.prompt([{
    type: 'list',
    name: 'reply',
    message,
    choices
  }])
  return reply
}

const askForConfirmation = async (message) => {
  const { reply } = await inquirer.prompt([{
    type: 'confirm',
    name: 'reply',
    message
  }])
  return reply
}

let cachedProjectRoot

const PGK_MANAGER_BIN_NPM = 'npm'
const debugLogger = process.env.DEBUG ? console.log : () => {}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

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

const getNodePackageManager = () => {
  return PGK_MANAGER_BIN_NPM
}

const installDeps = (cwd, task) => {
  const bin = getNodePackageManager()
  const installTask = execa(bin, ['install'], { cwd })
  installTask.stdout.on('data', log => {
    if (!log) return
    task.output = log
  })

  return installTask.catch(err => {
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
  } catch (err) {
    return null
  }
}

const runScriptTask = async (task, scriptName) => {
  if (!fs.existsSync('package.json')) {
    task.skip('No package.json found')
    return
  }

  const packageJson = await readJson('package.json')
  const scripts = packageJson.scripts || {}
  if (!scripts[scriptName]) {
    task.skip('Build script not defined in package.json')
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

const getContract = (pkg, contract) => {
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}

const ANY_ENTITY = '0xffffffffffffffffffffffffffffffffffffffff'
const NO_MANAGER = '0x0000000000000000000000000000000000000000'
const DEFAULT_GAS_FUZZ_FACTOR = 1.5
const LAST_BLOCK_GAS_LIMIT_FACTOR = 0.95

/**
 *
 * Calculate the recommended gas limit
 *
 * @param {*} web3 eth provider to get the last block gas limit
 * @param {number} estimatedGas estimated gas
 * @param {number} gasFuzzFactor defaults to 1.5
 * @returns {number} gasLimit
 */
const getRecommendedGasLimit = async (
  web3,
  estimatedGas,
  gasFuzzFactor = DEFAULT_GAS_FUZZ_FACTOR
) => {
  // TODO print these values if --debug is passed
  const latestBlock = await web3.eth.getBlock('latest')
  const blockGasLimit = latestBlock.gasLimit

  const upperGasLimit = Math.round(blockGasLimit * LAST_BLOCK_GAS_LIMIT_FACTOR)
  if (estimatedGas > upperGasLimit) return estimatedGas // TODO print a warning?

  const bufferedGasLimit = Math.round(estimatedGas * gasFuzzFactor)

  if (bufferedGasLimit < upperGasLimit) return bufferedGasLimit
  return upperGasLimit
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

/**
 * Validates an Aragon Id
 * @param {string} aragonId Aragon Id
 * @returns {boolean} `true` if valid
 */
function isValidAragonId(aragonId) {
  return /^[a-z0-9-]+$/.test(aragonId)
}

// let's try gracefully, otherwise we can do SIGTERM or SIGKILL
const defaultKillSignal = 'SIGINT'
const defaultLogger = process.env.DEBUG ? console.log : () => {}

async function startBackgroundProcess({
  cmd,
  args,
  execaOpts,
  readyOutput,
  logger = defaultLogger,
  killSignal = defaultKillSignal,
}) {
  return new Promise((resolve, reject) => {
    // start the process
    const subprocess = execa(cmd, args, execaOpts)
    
    let stdout = ''
    let stderr = ''
    let logPrefix 
    if(args && args.length > 0) {
      logPrefix = `${cmd} ${args[0]}` 
    } else {
      logPrefix = cmd
    }

    logger(logPrefix, 'spawned with PID: ', subprocess.pid)

    // return this function so the process can be killed
    const exit = () =>
      new Promise((resolve, reject) => {
        psTree(subprocess.pid, (err, children) => {
          if (err) reject(err)

          children.map(child => {
            // each child has the properties: COMMAND, PPID, PID, STAT
            logger(logPrefix, 'killing child: ', child)
            process.kill(child.PID, killSignal)
          })

          resolve()
        })
      })

    subprocess.stdout.on('data', data => {
      // parse
      data = data.toString()
      // log
      logger(logPrefix, 'stdout:', data)
      // build output stream
      stdout += data
      // check for ready signal
      if (data.includes(readyOutput)) {
        resolve({
          exit,
          stdout,
        })
      }
    })

    subprocess.stderr.on('data', data => {
      // parse
      data = data.toString()
      // log
      logger(logPrefix, 'stderr:', data)
      // build error stream
      stderr += data
    })

    subprocess.on('close', (code, signal) => {
      // log
      logger(logPrefix, 'closing with code:', code, 'and signal:', signal)

      // reject only if the promise did not previously resolve
      // which means this is probably getting killed by the test which is ok
      if (!stdout.includes(readyOutput)) {
        const err = new Error(
          `Process closed unexpectedly with code ${code} and signal ${signal}`
        )
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
      }
    })

    subprocess.on('exit', (code, signal) => {
      logger(logPrefix, 'exiting with code:', code, 'and signal:', signal)
    })
  })
}

/**
 * Some characters are rendered differently depending on the OS.
 *
 * @param {string} stdout
 */
function normalizeOutput(stdout) {
  const next = stdout
    .replace(/❯/g, '>')
    .replace(/ℹ/g, 'i')
    // TODO: remove after https://github.com/aragon/aragon-cli/issues/367 is fixed
    .replace(/cli.js/g, 'aragon')
    // sometimes there's an extra LF
    .trim()

  return next
}

module.exports = {
  parseArgumentStringIfPossible,
  debugLogger,
  findProjectRoot,
  isPortTaken,
  installDeps,
  runScriptTask,
  getNodePackageManager,
  getBinary,
  getLocalBinary,
  getGlobalBinary,
  getContract,
  isValidAragonId,
  ANY_ENTITY,
  NO_MANAGER,
  ZERO_ADDRESS,
  getRecommendedGasLimit,
  askForChoice,
  askForInput,
  askForConfirmation,
  startBackgroundProcess,
  normalizeOutput
}
