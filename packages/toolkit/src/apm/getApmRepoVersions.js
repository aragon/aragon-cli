import APM from '@aragon/apm'

export default async (web3, apmRepoName, apmOptions) => {
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

  // Query all versions for this repo.
  const versions = await apm.getAllVersions(apmRepoName)

  return versions
}
