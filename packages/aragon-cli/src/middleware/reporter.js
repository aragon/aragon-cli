const ConsoleReporter = require('../reporters/ConsoleReporter')

module.exports = function reporterMiddleware (argv) {
  return {
    reporter: new ConsoleReporter({
      silent: argv.silent
    })
  }
}
