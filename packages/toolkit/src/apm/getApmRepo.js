import useApm from './useApm'
import defaultAPMName from '../helpers/default-apm'
import { DEFAULT_IPFS_TIMEOUT, LATEST_VERSION } from '../helpers/constants'

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
  const apm = await useApm(environment)

  apmRepoName = defaultAPMName(apmRepoName)

  return apmRepoVersion === LATEST_VERSION
    ? apm.getLatestVersion(apmRepoName, DEFAULT_IPFS_TIMEOUT)
    : apm.getVersion(
        apmRepoName,
        apmRepoVersion.split('.'),
        DEFAULT_IPFS_TIMEOUT
      )
}
