const chalk = require('chalk')
const defaultAPMName = require('@aragon/cli-utils/src/helpers/default-apm')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const getApmRepo = require('../../lib/apm/getApmRepo')

exports.command = 'info <apmRepo> [apmRepoVersion]'

exports.describe = 'Get information about a package'

exports.builder = yargs => {
  return yargs
    .option('apmRepo', {
      describe: 'Name of the aragonPM repo',
    })
    .option('apmRepoVersion', {
      describe: 'Version of the package upgrading to',
      default: 'latest',
    })
}

exports.handler = async function({
  apmRepo,
  apmRepoVersion,
  apm: apmOptions,
  network,
}) {
  const web3 = await ensureWeb3(network)

  const apmRepoName = defaultAPMName(apmRepo)

  const progressHandler = step => {
    switch (step) {
      case 1:
        console.log(`Initialize aragonPM`)
        break
      case 2:
        // TODO: Use reporter instead of chalk? Should reporter have a 'title' function?
        console.log(`Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`)
        break
    }
  }

  const apmRepoObject = await getApmRepo(
    web3,
    apmRepoName,
    apmRepoVersion,
    apmOptions,
    progressHandler
  )
  // TODO: Improve parsing of abi and env to display useful information
  delete apmRepoObject.abi
  delete apmRepoObject.environments

  const apmRepoJSON = JSON.stringify(apmRepoObject, null, 2)
  console.log(apmRepoJSON)
  process.exit()
}
