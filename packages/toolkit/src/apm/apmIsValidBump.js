import aragonPM from '@aragon/apm'

/**
 * Validates a new version for an APM repository
 *
 * @param {Object} web3 Web3 object
 * @param {string} apmRepoName APM repository id
 * @param {string} previousVersion Previous version
 * @param {string} version New version
 * @param {Object} apmOptions APM options
 * @returns {Promise<boolean>} A promise that resolves whether or not the version is valid
 */
export default async (
  web3,
  apmRepoName,
  previousVersion,
  version,
  apmOptions
) => {
  const apm = await aragonPM(web3, apmOptions)

  return apm.isValidBump(apmRepoName, previousVersion, version)
}
