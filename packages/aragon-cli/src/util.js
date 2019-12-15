import os from 'os'
const findUp = require('find-up')
const path = require('path')
const execa = require('execa')
const fs = require('fs')
const { readJson } = require('fs-extra')
const { request } = require('http')
const inquirer = require('inquirer')
const { getNodePackageManager } = require('@aragon/toolkit/dist/node')

let cachedProjectRoot

/**
 * Some characters are rendered differently depending on the OS.
 *
 * @param {string} stdout
 */
function normalizeOutput(stdout) {
  const next = stdout
    // remove user-specific paths
    .replace(/❯/g, '>')
    .replace(/ℹ/g, 'i')
    // TODO: remove after https://github.com/aragon/aragon-cli/issues/367 is fixed
    .replace(/cli.js/g, 'aragon')
    // replace homedir in paths
    .replace(new RegExp(os.homedir(), 'g'), '~')
    // sometimes there's an extra LF
    .trim()

  return next
}

const findProjectRoot = () => {
  if (!cachedProjectRoot) {
    try {
      cachedProjectRoot = path.dirname(findUp.sync('arapp.json'))
    } catch (_) {
      throw new Error('This directory is not an Aragon project')
    }
  }
  return cachedProjectRoot
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
  try {
    return execa(bin, ['run', scriptName]).stdout
  } catch (err) {
    throw new Error(
      `${err.message}\n${err.stderr}\n\nFailed to build. See above output.`
    )
  }
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
  normalizeOutput,
  parseArgumentStringIfPossible,
  findProjectRoot,
  isHttpServerOpen,
  installDeps,
  runScriptTask,
  askForInput,
  askForChoice,
  askForConfirmation,
}
