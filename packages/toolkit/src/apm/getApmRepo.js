import { DEFAULT_IPFS_TIMEOUT } from '../helpers/constants'
import aragonPM from '@aragon/apm'

const LATEST_VERSION = 'latest'

/**
 *
 * Progress callback will be invoked with the following integers:
 * (1) - Initialize aragonPM object-contract comunication
 * (2) - Fetch aragonPM contracts and retrive an object containing version info about the aragonPM repo
 *
 * @param {*} web3 todo
 * @param {*} apmRepoName todo
 * @param {*} apmRepoVersion todo
 * @param {*} apmOptions todo
 * @param {*} progressHandler todo
 * @returns {*} todo
 */
export default async (
  web3,
  apmRepoName,
  apmRepoVersion,
  apmOptions,
  progressHandler
) => {
  if (progressHandler) {
    progressHandler(1)
  }

  // Ensure the ens-registry property is present,
  // and available with the name "ensRegistryAddress".
  if (!apmOptions.ensRegistryAddress) {
    if (apmOptions['ens-registry']) {
      apmOptions.ensRegistryAddress = apmOptions['ens-registry']
    } else {
      throw new Error('ens-registry not found in given apm options.')
    }
  }

  // Prepare aragonPM object that can comunicate with the apm contracts.
  const apm = await aragonPM(web3, apmOptions)

  if (progressHandler) {
    progressHandler(2)
  }

  // Query the apm contracts to retrieve an object
  // containing version info about the apm repo.
  const info =
    apmRepoVersion === LATEST_VERSION
      ? await apm.getLatestVersion(apmRepoName, DEFAULT_IPFS_TIMEOUT)
      : await apm.getVersion(
          apmRepoName,
          apmRepoVersion.split('.'),
          DEFAULT_IPFS_TIMEOUT
        )

  return info
}
