import findUp from 'find-up'
import path from 'path'
import execa from 'execa'
import fs from 'fs'
import os from 'os'
import { readJson } from 'fs-extra'
import { request } from 'http'
import inquirer from 'inquirer'
import { getNodePackageManager } from '@aragon/toolkit'

let cachedProjectRoot

/**
 * Some characters are rendered differently depending on the OS.
 *
 * @param {string} stdout
 */
export function normalizeOutput(stdout) {
  const next = stdout
    // remove user-specific paths
    .replace(/❯/g, '>')
    .replace(/ℹ/g, 'i')
    // TODO: remove after https://github.com/aragon/aragon-cli/issues/367 is fixed
    .replace(/cli.js/g, 'aragon')
    .replace(/index.js/g, 'aragon')
    // replace homedir in paths
    .replace(new RegExp(os.homedir(), 'g'), '~')
    // sometimes there's an extra LF
    .trim()

  return next
}

export const findProjectRoot = () => {
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
export function isHttpServerOpen(url) {
  return new Promise(resolve => {
    request(url, { method: 'HEAD' }, r => {
      resolve(r.statusCode >= 200 && r.statusCode < 400)
    })
      .on('error', () => resolve(false))
      .end()
  })
}

export const installDeps = (cwd, task) => {
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
 * Run a npm script.
 * @param {string} scriptName
 * @return {Promise<string>} feeback, if the helper aborts early it may return
 * a string with a reason message
 */
export const runScriptHelper = async (scriptName, logCallback) => {
  if (!fs.existsSync('package.json')) {
    return 'No package.json found'
  }

  const { scripts = {} } = await readJson('package.json')
  if (!scripts[scriptName]) {
    return `${scriptName} script not defined in package.json`
  }

  const bin = getNodePackageManager()
  const scriptProcess = execa(bin, ['run', scriptName])

  scriptProcess.stdout.on('data', log => {
    if (logCallback) logCallback(`npm run ${scriptName}: ${log}`)
  })

  try {
    await scriptProcess
  } catch (err) {
    throw new Error(
      `${err.message}\n${err.stderr}\n\nScript ${scriptName} failed. See above output.`
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
export const parseAsBoolean = target => {
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
export const parseAsArray = target => {
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
export const parseArgumentStringIfPossible = target => {
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

export const askForInput = async message => {
  const { reply } = await inquirer.prompt([
    {
      type: 'input',
      name: 'reply',
      message,
    },
  ])
  return reply
}

export const askForChoice = async (message, choices) => {
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

export const askForConfirmation = async message => {
  const { reply } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'reply',
      message,
    },
  ])
  return reply
}
