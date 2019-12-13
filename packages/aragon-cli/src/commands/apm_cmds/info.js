import { bold } from 'chalk'
import getApmRepo from '@aragon/toolkit/dist/apm/getApmRepo'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

import defaultAPMName from '../../helpers/default-apm'

export const command = 'info <apmRepo> [apmRepoVersion]'
export const describe = 'Get information about a package'

export const builder = yargs => {
  return yargs
    .option('apmRepo', {
      describe: 'Name of the aragonPM repo',
    })
    .option('apmRepoVersion', {
      describe: 'Version of the package upgrading to',
      default: 'latest',
    })
}

export const handler = async function({
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
        console.log(`Fetching ${bold(apmRepo)}@${apmRepoVersion}`)
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
}
