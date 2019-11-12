const chalk = require('chalk')
const defaultAPMName = require('@aragon/cli-utils/src/helpers/default-apm')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const getApmRepoVersions = require('../../lib/apm/getApmRepoVersions')

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
  const apmRepoName = apmRepo ? defaultAPMName(apmRepo) : module.appName

  const progressHandler = step => {
    switch (step) {
      case 1:
        console.log(`Fetching ${chalk.bold(apmRepoName)} published versions`)
        break
    }
  }

  const versions = await getApmRepoVersions(
    web3,
    apmRepoName,
    apmOptions,
    progressHandler
  )

  reporter.info(
    `${chalk.blue(apmRepoName)} has ${chalk.green(
      versions.length
    )} published versions`
  )

  versions.map(version => {
    if (version && version.content) {
      reporter.success(
        `${chalk.blue(version.version)}: ${version.contractAddress} ${
          version.content.provider
        }:${version.content.location}`
      )
    } else if (version && version.error) {
      reporter.warning(
        `${chalk.blue(version.version)}: ${version.contractAddress} ${
          version.error
        }`
      )
    } else {
      reporter.error(
        `${chalk.blue(version.version)}: ${
          version.contractAddress
        } Version not found in provider`
      )
    }
  })
  process.exit()
}
