import {
  DEBUG_ICON,
  INFO_ICON,
  WARNING_ICON,
  ERROR_ICON,
  SUCCESS_ICON,
} from './ReporterIcons'

export default class ConsoleReporter {
  constructor(options) {
    const defaultOptions = {
      silent: false,
      debug: false,
    }
    this.opts = Object.assign({}, defaultOptions, options)
  }

  message(...messages) {
    if (this.opts.silent) return

    console.log(...messages)
  }

  debug(...messages) {
    if (!this.opts.debug) return

    this.message(DEBUG_ICON, ...messages)
  }

  info(...messages) {
    this.message(INFO_ICON, ...messages)
  }

  warning(...messages) {
    this.message(WARNING_ICON, ...messages)
  }

  error(...messages) {
    this.message(ERROR_ICON, ...messages)
  }

  success(...messages) {
    this.message(SUCCESS_ICON, ...messages)
  }

  newLine() {
    this.message()
  }
}
