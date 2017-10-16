const chalk = require('chalk')

const log = (level, message) => {
  const colors = {
    info: 'blue',
    error: 'red',
    warning: 'yellow'
  }

  console.log(`${chalk[colors[level]](level)}: ${message}`)
}

module.exports = {
  info (message) {
    log('info', message)
  },
  error (message) {
    log('error', message)
  },
  fatal (message) {
    this.error(message)
    process.exit(1)
  },
  warning (message) {
    log('warning', message)
  }
}
