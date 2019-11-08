const APM = require('@aragon/apm')

module.exports = async (web3, apmRegistryName, apmOptions, progressHandler) => {
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

  const apm = await APM(web3, apmOptions)

  if (progressHandler) {
    progressHandler(2)
  }

  const registry = await apm.getRepoRegistry(`vault.${apmRegistryName}`)

  if (progressHandler) {
    progressHandler(3)
  }

  const newRepoEvents = await registry.getPastEvents('NewRepo', { fromBlock: 0 })

  if (progressHandler) {
    progressHandler(4)
  }

  const packages = await Promise.all(
    newRepoEvents.map(async event => {
      const args = event.returnValues
      return {
        name: args.name,
        version: (await apm.getLatestVersion(args.id)).version
      }
    })
  )

  if (progressHandler) {
    progressHandler(5)
  }

  return packages
}
