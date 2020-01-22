import aragonPM from '@aragon/apm'

/**
 * Create an intent to publish a new version (`version`) of `appId` using storage provider `provider`.
 *
 * If the destination repository does not exist, the intent will be for creating a new
 * repository with an initial version.
 *
 * Returns an object with the needed components to execute an aragon.js intent
 *
 * @param {Object} web3 web3
 * @param {string} manager The address that will manage the new repo if it has to be created.
 * @param {string} appId The ENS name for the application repository.
 * @param {string} version A valid semantic version for this version.
 * @param {string} provider The name of an APM storage provider.
 * @param {string} directory The directory that contains files to publish.
 * @param {string} contract The new contract address for this version.
 * @param {Object} apmOptions APM options
 * @return {Promise} A promise that resolves to an aragon.js intent
 */
export default async (
  web3,
  manager,
  appId,
  version,
  provider,
  directory,
  contract,
  apmOptions
) => {
  const apm = await aragonPM(web3, apmOptions)

  return apm.publishVersionIntent(
    manager,
    appId,
    version,
    provider,
    directory,
    contract
  )
}
