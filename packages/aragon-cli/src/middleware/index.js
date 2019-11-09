const { loadManifestFile, loadArappFile } = require('../lib/loadConfigFiles')
const { configEnvironment } = require('../lib/configEnvironment')

export function configCliMiddleware(argv) {
  const [cmd, subcmd] = argv._
  const isInit = cmd === 'init'

  if (isInit) return {}

  try {
    // Load config files

    const manifest = loadManifestFile()
    const arapp = loadArappFile()

    // Configure environment (+ network)

    if (!arapp)
      argv.reporter.debug(
        `Could not find 'arapp.json'. Using the default configuration`
      )

    const ignoreNetCmd = new Set(['version']) // i.e. 'aragon apm version'
    const ignoreNetSubCmd = new Set(['init', 'devchain', 'ipfs', 'contracts']) // (TODO): remove init
    const isTruffleFwd = cmd === 'contracts'
    const ignoreNetwork = ignoreNetSubCmd.has(subcmd) || ignoreNetCmd.has(cmd)
    const { useFrame, environment, network, apm } = argv

    if (environment && network && !isTruffleFwd)
      throw Error(
        "Arguments '--network' and '--environment' are mutually exclusive. Using '--network'  has been deprecated and  '--environment' should be used instead."
      )
    if (network && arapp && arapp.environments && !isTruffleFwd)
      throw Error(
        "Your arapp.json contains an `environments` property. The use of '--network' is deprecated and '--environment' should be used instead."
      )
    if (arapp && !arapp.environments && environment)
      throw Error(
        "Your arapp.json does not contain an `environments` property. The use of '--environment'  is not supported."
      )

    const {
      arapp: arappMutated,
      apm: apmMutated,
      network: networkObj,
      wsProvider,
    } = configEnvironment({
      arapp,
      ignoreNetwork,
      useFrame,
      isTruffleFwd,
      environment,
      network,
      apm,
    })

    return {
      manifest,
      module: arappMutated,
      apm: apmMutated,
      network: networkObj,
      wsProvider,
    }
  } catch (e) {
    // Show errors prettier with the reporter
    argv.reporter.error(e.message)
    process.exit(1)
  }
}
