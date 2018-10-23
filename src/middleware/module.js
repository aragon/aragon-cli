const path = require('path')
const fs = require('fs-extra')
const { findProjectRoot } = require('../util')

module.exports = function moduleMiddleware (argv) {
  const runsInCwd = argv['_'] === 'init'
  if (!runsInCwd) {
    try {
      const modulePath = path.resolve(findProjectRoot(), 'arapp.json')
      const arapp = fs.readJsonSync(modulePath)

      // hack: we need to access the module in downstream middleware, but
      // yargs does not update the `argv` param until all middleware have
      // ran, so we directly mutate the `argv` param
      // https://github.com/yargs/yargs/issues/1232
      argv.module = arapp
    } catch (err) {
      // argv.reporter.debug(err)
    }
  }

  return {}
}
