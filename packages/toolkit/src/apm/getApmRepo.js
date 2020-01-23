import aragonPM from '@aragon/apm'
//
import { DEFAULT_IPFS_TIMEOUT } from '../helpers/constants'

const LATEST_VERSION = 'latest'

/**
 *
 * Progress callback will be invoked with the following integers:
 * (1) - Initialize aragonPM object-contract comunication
 * (2) - Fetch aragonPM contracts and retrive an object containing version info about the aragonPM repo
 *
 * @param {*} web3 todo
 * @param {*} apmRepoName todo
 * @param {*} apmOptions todo
 * @param {*} apmRepoVersion todo
 * @param {*} progressHandler todo
 * @returns {*} todo
 */
export default async (
  web3,
  apmRepoName,
  apmOptions,
  apmRepoVersion = LATEST_VERSION,
  progressHandler = () => {}
) => {
  if (progressHandler) {
    progressHandler(1)
  }

  // TODO: something like const apmOptions = getEnvrionment().apm
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
