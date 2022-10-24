import { loadArappFile } from '@aragon/toolkit'
//
// import { ensureWeb3 } from '../helpers/web3-fallback'

class InvalidArguments extends Error {}

export function configEnvironmentMiddleware(argv) {
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

    // TODO: Initialize toolkit once and pass on args
    // await ensureWeb3(web3)

    return {
      environment,
    }
  } catch (e) {
    const prettyError = message => {
      argv.reporter.error(message)
      process.exit(1)
    }

    if (e instanceof InvalidArguments) return prettyError(e.message)
    // TODO: Errors from useEnvironment
    // if (e instanceof NoEnvironmentInArapp)
    // return prettyError(
    // `environment '${e.message}' is not defined in your arapp.json.`
    // )
    // if (e instanceof NoEnvironmentInDefaults)
    // return prettyError(
    // `Default environment '${e.message}' not found. Try using aragon:local, aragon:goerli or aragon:mainnet.`
    // )
    // if (e instanceof NoNetworkInTruffleConfig)
    // return prettyError(
    // `aragon <command> requires a network '${e.message}' in your truffle.js. For an example, see http://truffleframework.com/docs/advanced/configuration`
    // )

    throw e
  }
}
