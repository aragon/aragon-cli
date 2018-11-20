const ListrRenderer = require('../reporters/ListrRenderer')

/**
 * https://github.com/SamVerschueren/listr#options
 * https://github.com/SamVerschueren/listr-update-renderer#options
 * https://github.com/SamVerschueren/listr-verbose-renderer#options
 *
 * @param {boolean} silent
 * @param {boolean} debug
 * @returns {Object} listr options object
 */
function listrOpts (silent, debug) {
  return {
    renderer: ListrRenderer(silent, debug),
    dateFormat: false
  }
}

module.exports = listrOpts
