import { getTruffleConfig } from '../helpers/truffle-config'
import {
  loadManifestFile,
  loadArappFile,
} from '../lib/environment/loadConfigFiles'
import {
  configEnvironment,
  NoEnvironmentInArapp,
  NoEnvironmentInDefaults,
  NoNetworkInTruffleConfig,
} from '../lib/environment/configEnvironment'

class InvalidArguments extends Error {}

export function configCliMiddleware(argv) {
  const [cmd, subcmd] = argv._
  const { reporter } = argv

  try {
    // Load config files

    const manifest = loadManifestFile()
    const arapp = loadArappFile()

    // Configure environment

    if (!arapp)
      reporter.debug(
        `Could not find 'arapp.json'. Using the default configuration`
      )

    const ignoreNetCmd = new Set([''])
    const ignoreNetSubCmd = new Set(['devchain', 'ipfs'])
    const ignoreNetwork = ignoreNetSubCmd.has(subcmd) || ignoreNetCmd.has(cmd)
    const { useFrame, environment, ensRegistry, ipfsRpc, ipfsGateway } = argv

    const {
      arapp: arappMutated,
      apm: apmMutated,
      network: networkObj,
      wsProvider,
    } = configEnvironment({
      ignoreNetwork,
      useFrame,
      environment,
      ensRegistry,
      ipfsRpc,
      ipfsGateway,
      arapp,
      truffleConfig: arapp && getTruffleConfig(),
    })

    if (wsProvider?.connection?.url?.includes('eth.aragon.network')) {
      reporter.warning(
        `You are currently using the Aragon Ethereum node (${wsProvider.connection.url}). Consider switching to Infura (https://infura.io) for better performances. See the "wsRPC" field of https://hack.aragon.org/docs/cli-global-confg for more information.`
      )
    }

    return {
      manifest,
      module: arappMutated,
      apm: apmMutated,
      network: networkObj,
      wsProvider,
    }
  } catch (e) {
    const prettyError = message => {
      reporter.error(message)
      process.exit(1)
    }

    if (e instanceof InvalidArguments) return prettyError(e.message)
    // Errors from configEnvironment
    if (e instanceof NoEnvironmentInArapp)
      return prettyError(
        `environment '${e.message}' is not defined in your arapp.json.`
      )
    if (e instanceof NoEnvironmentInDefaults)
      return prettyError(
        `Default environment '${e.message}' not found. Try using aragon:local, aragon:rinkeby or aragon:mainnet.`
      )
    if (e instanceof NoNetworkInTruffleConfig)
      return prettyError(
        `aragon <command> requires a network '${e.message}' in your truffle.js. For an example, see http://truffleframework.com/docs/advanced/configuration`
      )

    throw e
  }
}
