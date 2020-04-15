import ConsoleReporter from './ConsoleReporter'
// TODO FileReporter: save "--debug" output as logs in ~/.aragon
import { ERROR_ICON, WARNING_ICON } from './ReporterIcons'

export * from './ReporterIcons'

export const configure = (yargs) =>
  yargs
    .option('silent', {
      boolean: true,
      description: 'Silence all output',
      default: false,
    })
    .option('debug', {
      boolean: true,
      description: 'Show extra output',
      default: false,
    })
    .alias('s', 'silent')
    .alias('d', 'debug')
    .group(['debug', 'silent'], 'Global options:')
    .middleware([middleware])

export const middleware = (argv) => {
  const { silent, debug } = argv
  const reporter = new ConsoleReporter({ silent, debug })
  return { reporter }
}

export const errorHandler = (msg, err) => {
  const { argv } = process

  if (argv.includes('--silent') || argv.includes('--s')) {
    return process.exit(1)
  }

  // an error from yargs
  if (msg) {
    console.error(ERROR_ICON, msg)
    console.error(WARNING_ICON, 'Use --help to show the available commands')
    return process.exit(1)
  }

  // an error that was thrown and which has a stack
  if (argv.includes('--debug') || argv.includes('--d')) {
    // errors thrown by listr have a context property which makes printing less nice
    delete err.context
    console.error(ERROR_ICON, err)
  } else {
    console.error(ERROR_ICON, err.message)
  }

  return process.exit(1)
}
