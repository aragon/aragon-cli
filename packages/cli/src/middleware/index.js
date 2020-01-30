import {
  loadArappFile,
} from '@aragon/toolkit'

class InvalidArguments extends Error { }

export function configEnvironmentMiddleware (argv) {
  try {
    // Load arapp file
    const arapp = loadArappFile()

    if (!arapp)
      argv.reporter.debug(
        `Could not find 'arapp.json'. Using the default configuration`
      )

    let { useFrame, environment } = argv

    // Transform environment
    environment = useFrame ? `frame:${environment}` : environment

    return {
      environment,
    }
  } catch (e) {
    const prettyError = message => {
      argv.reporter.error(message)
      process.exit(1)
    }

    if (e instanceof InvalidArguments) return prettyError(e.message)

    throw e
  }
}
