const chalk = require('chalk')
const figures = require('figures')

const ICON_MAP = {
  debug: {
    color: 'magenta',
    symbol: 'pointer'
  },
  info: {
    color: 'blue',
    symbol: 'info'
  },
  warning: {
    color: 'yellow',
    symbol: 'warning'
  },
  error: {
    color: 'red',
    symbol: 'cross'
  },
  success: {
    color: 'green',
    symbol: 'tick'
  }
}

const getIcon = name => {
  const { color, symbol } = ICON_MAP[name]
  return chalk[color](
    figures[symbol]
  )
}

module.exports = class ConsoleReporter {
  constructor(opts = { silent: false }) {
    this.silent = opts.silent
  }

  message (category = 'info', ...messages) {
    if (this.silent) return

    const icon = getIcon(category)

    console.log(icon, ...messages)
  }

  debug (...messages) {
    if (global.DEBUG_MODE) this.message('debug', ...messages)
  }

  info (...messages) {
    this.message('info', ...messages)
  }

  warning (...messages) {
    this.message('warning', ...messages)
  }

  error (...messages) {
    this.message('error', ...messages)
  }

  success (...messages) {
    this.message('success', ...messages)
  }

  newLine () {
    console.log()
  }
}
