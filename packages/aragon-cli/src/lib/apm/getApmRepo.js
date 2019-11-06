const pkg = require('../../../package.json')
const APM = require('@aragon/apm')

const LATEST_VERSION = 'latest'
const DEFAULT_IPFS_TIMEOUT = pkg.aragon.defaultIpfsTimeout

module.exports = async (web3, apmRepoName, apmRepoVersion, apmOptions, progressHandler) => {
  if (progressHandler) progressHandler(1)

  // Ensure the ens-registry property is present,
  // and available with the name "ensRegistryAddress".
  if (!apmOptions.ensRegistryAddress) {
    if (apmOptions['ens-registry']) {
      apmOptions.ensRegistryAddress = apmOptions['ens-registry']
    } else {
      throw new Error('ens-registry not found in given apm options.')
    }
  }

  // Prepare APM object that can comunicate with the apm contracts.
  const apm = await APM(web3, apmOptions)

  // Query the apm contracts to retrieve an object
  // containing version info about the apm repo.
  if (apmRepoVersion === LATEST_VERSION) {
    return await apm.getLatestVersion(apmRepoName, DEFAULT_IPFS_TIMEOUT)
  } else {
    return await apm.getVersion(
      apmRepoName,
      apmRepoVersion.split('.'),
      DEFAULT_IPFS_TIMEOUT
    )
  }
}
