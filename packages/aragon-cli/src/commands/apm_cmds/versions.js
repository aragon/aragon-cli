const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')

exports.command = 'versions [apmRepo]'

exports.describe =
  'Shows all the previously published versions of a given repository'

exports.builder = function(yargs) {
  return yargs.option('apmRepo', {
    description: 'Name of the APM repository',
    type: 'string',
    default: null,
  })
}

exports.handler = async function({
  reporter,
  apmRepo,
  module,
  network,
  apm: apmOptions,
}) {
  const web3 = await ensureWeb3(network)
  const repoName = apmRepo ? defaultAPMName(apmRepo) : module.appName
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const versions = await APM(web3, apmOptions).getAllVersions(repoName)

  reporter.info(`${repoName} has ${versions.length} published versions`)

  versions.map(version => {
    if (version && version.content) {
      reporter.success(
        `${version.version}: ${version.contractAddress} ${
          version.content.provider
        }:${version.content.location}`
      )
    } else if (version && version.error) {
      reporter.warning(
        `${version.version}: ${version.contractAddress} ${version.error}`
      )
    } else {
      reporter.error(
        `${version.version}: ${
          version.contractAddress
        } Version not found in provider`
      )
    }
  })
  process.exit()
}
