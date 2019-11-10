const pkg = require('../../../package.json')
const APM = require('@aragon/apm')

const LATEST_VERSION = 'latest'
const DEFAULT_IPFS_TIMEOUT = pkg.aragon.defaultIpfsTimeout

module.exports = async (web3, apmRepoName, apmRepoVersion, apmOptions, progressHandler) => {
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

  // Prepare APM object that can comunicate with the apm contracts.
  const apm = await APM(web3, apmOptions)

  if (progressHandler) {
    progressHandler(2)
  }

  // Query the apm contracts to retrieve an object
  // containing version info about the apm repo.
  let info
  if (apmRepoVersion === LATEST_VERSION) {
    info = await apm.getLatestVersion(apmRepoName, DEFAULT_IPFS_TIMEOUT)
  } else {
    info = await apm.getVersion(
      apmRepoName,
      apmRepoVersion.split('.'),
      DEFAULT_IPFS_TIMEOUT
    )
  }

  if (progressHandler) {
    progressHandler(3)
  }

  return info
}
