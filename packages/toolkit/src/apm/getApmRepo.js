import getApm from './apm'
import getDefaultApmName from '../utils/defaultApm'

const DEFAULT_IPFS_TIMEOUT = 300000
const LATEST_VERSION = 'latest'

/**
 *
 * Return a Repo object from aragonPM
 *
 * @param {string} apmRepoName APM repo name
 * @param {string} apmRepoVersion APM repo version
 * @param  {string} environment Envrionment
 * @returns {Object} Repo
 */
export default async function getApmRepo(
  apmRepoName,
  apmRepoVersion = LATEST_VERSION,
  environment
) {
  const apm = await getApm(environment)

  apmRepoName = getDefaultApmName(apmRepoName)

  return apmRepoVersion === LATEST_VERSION
    ? apm.getLatestVersion(apmRepoName, DEFAULT_IPFS_TIMEOUT)
    : apm.getVersion(
        apmRepoName,
        apmRepoVersion.split('.'),
        DEFAULT_IPFS_TIMEOUT
      )
}
