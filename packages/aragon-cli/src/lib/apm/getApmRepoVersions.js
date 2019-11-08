const APM = require('@aragon/apm')

module.exports = async (web3, apmRepoName, apmOptions, progressHandler) => {
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

  // Query all versions for this repo.
  const versions = await apm.getAllVersions(apmRepoName)

  if (progressHandler) {
    progressHandler(3)
  }

  return versions
}
