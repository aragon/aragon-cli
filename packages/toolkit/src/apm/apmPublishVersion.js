import aragonPM from '@aragon/apm'

/**
 * Publishes a new version (`version`) of `appId` using storage provider `provider`.
 *
 * If the destination repository does not exist, it falls back to creating a new
 * repository with an initial version controlled by an initial manager.
 *
 * Returns the raw transaction to sign.
 *
 * @param {Object} web3 web3
 * @param {string} manager The address that will manage the new repo if it has to be created.
 * @param {string} appId The ENS name for the application repository.
 * @param {string} version A valid semantic version for this version.
 * @param {string} provider The name of an APM storage provider.
 * @param {string} directory The directory that contains files to publish.
 * @param {string} contract The new contract address for this version.
 * @param {string} from The account address we should estimate the gas with
 * @param {Object} apmOptions APM options
 * @return {Promise} A promise that resolves to a raw transaction
 */
export default async (
  web3,
  manager,
  appId,
  version,
  provider,
  directory,
  contract,
  from,
  apmOptions
) => {
  const apm = await aragonPM(web3, apmOptions)

  return apm.publishVersion(
    manager,
    appId,
    version,
    provider,
    directory,
    contract,
    from
  )
}
