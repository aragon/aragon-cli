const chalk = require('chalk')

module.exports = class ConsoleReporter {
  constructor (opts = { silent: false }) {
    this.silent = opts.silent
  }

  message (category = 'info', message) {
    if (this.silent) return

    const colors = {
      debug: 'magenta',
      info: 'blue',
      warning: 'yellow',
      error: 'red',
      success: 'green'
    }
    console.log(`${chalk[colors[category]](category)}: ${message}`)
  }

  debug (message) {
    if (process.env.DEBUG) this.message('debug', message)
  }

  info (message) {
    this.message('info', message)
  }

  warning (message) {
    this.message('warning', message)
  }

  error (message) {
    this.message('error', message)
  }

  success (message) {
    this.message('success', message)
  }
}
