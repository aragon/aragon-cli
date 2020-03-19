import { bold } from 'chalk'
import { getApmRepo } from '@aragon/toolkit'

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
  // Globals
  reporter,
  environment,
  // Arguments
  apmRepo,
  apmRepoVersion,
}) {
  const repo = await getApmRepo(apmRepo, apmRepoVersion, environment)

  reporter.info(`Fetching ${bold(apmRepo)}@${apmRepoVersion}`)

  // TODO: Improve parsing of abi and env to display useful information
  delete repo.abi
  delete repo.environments

  const apmRepoJSON = JSON.stringify(repo, null, 2)
  console.log('\n', apmRepoJSON)
}
