const chalk = require('chalk')

module.exports = class ConsoleReporter {
  message (category = 'info', message) {
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
    this.message('debug', message)
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
