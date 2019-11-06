const path = require('path')
const fs = require('fs-extra')
const { findProjectRoot } = require('../util')

module.exports = function moduleMiddleware(argv) {
  const runsInCwd = argv._ === 'init'
  if (!runsInCwd) {
    try {
      const modulePath = path.resolve(findProjectRoot(), 'arapp.json')
      const arapp = fs.readJsonSync(modulePath)

      const Ajv = require('ajv')
      const arappSchema = require('../../schemas/arapp.schema')
      const ajv = new Ajv({ allErrors: true })
      const validate = ajv.compile(arappSchema)
      const valid = validate(arapp)

      if (!valid) {
        const errors = ajv.errorsText(validate.errors, {
          dataVar: 'arapp',
        })
        argv.reporter.error(`Error parsing the aragon config file: ${errors}!`)
        process.exit(1)
      }

      // hack: we need to access the module in downstream middleware (environmentMiddleware), but
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
