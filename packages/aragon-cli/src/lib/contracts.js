const { runTruffle } = require('../helpers/truffle-runner')

/**
 * Extracts arguments to pass down to truffle
 *
 * @param {string[]} argv Process arguments
 * @returns {string[]} Truffle arguments
 */
const extractTruffleArgs = argv => {
  return argv.slice(argv.indexOf('contracts') + 1)
}

/**
 * Aragon contracts command. Runs a truffle command.
 *
 * @param {string[]} truffleArgs Arguments to pass to truffle
 * @param {Object} options IO options
 * @returns {Promise<void>}
 */
const contracts = async (truffleArgs, options = {}) => {
  try {
    return await runTruffle(truffleArgs, options)
  } catch (err) {
    // Truffle returns a `code 1` for the help command and makes execa
    // throw an exception but the output is still valid.
  }
}

module.exports = { extractTruffleArgs, contracts }
