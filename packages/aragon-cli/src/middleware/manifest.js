const path = require('path')
const fs = require('fs-extra')
const { findProjectRoot } = require('../util')

module.exports = function manifestMiddleware (argv) {
  const runsInCwd = argv['_'] === 'init'
  if (!runsInCwd) {
    try {
      const manifestPath = path.resolve(findProjectRoot(), 'manifest.json')
      manifest = fs.readJsonSync(manifestPath)

      return { manifest }
    } catch (err) {
      // argv.reporter.debug(err)
    }
  }

  return {}
}
