import { bold } from 'chalk'
import { getApmRepo, defaultAPMName } from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

export const command = 'info <apmRepo> [apmRepoVersion]'
export const describe = 'Get information about a package'

export const builder = (yargs) => {
  return yargs
    .option('apmRepo', {
      describe: 'Name of the aragonPM repo',
    })
    .option('apmRepoVersion', {
      describe: 'Version of the package upgrading to',
      default: 'latest',
    })
}

export const handler = async function ({
  apmRepo,
  apmRepoVersion,
  apm: apmOptions,
  network,
}) {
  const web3 = await ensureWeb3(network)

  const apmRepoName = defaultAPMName(apmRepo)

  const progressHandler = (step) => {
    switch (step) {
      case 1:
        console.log(`Initialize aragonPM`)
        break
      case 2:
        // TODO: Use reporter instead of chalk? Should reporter have a 'title' function?
        console.log(`Fetching ${bold(apmRepo)}@${apmRepoVersion}`)
        break
    }
  }

  const apmRepoObject = await getApmRepo(
    web3,
    apmRepoName,
    apmOptions,
    apmRepoVersion,
    progressHandler
  )
  // TODO: Improve parsing of abi and env to display useful information
  delete apmRepoObject.abi
  delete apmRepoObject.environments

  const apmRepoJSON = JSON.stringify(apmRepoObject, null, 2)
  console.log('\n', apmRepoJSON)
}
