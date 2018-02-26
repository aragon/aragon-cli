const path = require('path')
const fs = require('fs-extra')
const { findProjectRoot } = require('../util')

module.exports = function moduleMiddleware (argv) {
  const runsInCwd = argv['_'] === 'init'
  if (!runsInCwd) {
    try {
      const modulePath = path.resolve(findProjectRoot(), 'arapp.json')
      module = fs.readJsonSync(modulePath)

      return { module }
    } catch (err) {
      // argv.reporter.debug(err)
    }
  }

  return {}
}
