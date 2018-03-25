const chalk = require('chalk')

module.exports = class ConsoleReporter {
  constructor (opts = { silent: false }) {
    this.silent = opts.silent
  }

  message (category = 'info', message) {
    if (this.silent) return

    const color = {
      debug: 'magenta',
      info: 'blue',
      warning: 'yellow',
      error: 'red',
      success: 'green'
    }[category]
    const symbol = {
      debug: '-',
      info: 'i',
      warning: '~',
      error: '!',
      success: '='
    }[category]
    const icon = chalk[color](`[${symbol}]`)
    console.log(`${icon} ${message}`)
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
