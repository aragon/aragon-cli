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
export default async (
  apmRepoName,
  apmRepoVersion = LATEST_VERSION,
  environment,
) => {

  const apm = await useApm(environment)

  apmRepoName = defaultAPMName(apmRepoName)

  return apmRepoVersion === LATEST_VERSION
    ? await apm.getLatestVersion(apmRepoName, DEFAULT_IPFS_TIMEOUT)
    : await apm.getVersion(
      apmRepoName,
      apmRepoVersion.split('.'),
      DEFAULT_IPFS_TIMEOUT
    )
}
