import APM from '@aragon/apm'

/**
 * Return packages for a given APM registry.
 * `progressHandler` can be called with 2 values:
 * - 1: Fetching APM Registry
 * - 2: Gathering packages in registry
 *
 * @param {Object} web3 web3
 * @param {string} apmRegistryName APM registry name
 * @param {Object} apmOptions APM options
 * @param {function(number)} progressHandler Progress handler
 * @returns {void}
 */
export default async (
  web3,
  apmRegistryName,
  apmOptions,
  progressHandler = () => {}
) => {
  const apm = await APM(web3, apmOptions)

  progressHandler(1)

  const registry = await apm.getRepoRegistry(`vault.${apmRegistryName}`)

  const newRepoEvents = await registry.getPastEvents('NewRepo', {
    fromBlock: 0,
  })

  progressHandler(2)

  const packages = await Promise.all(
    newRepoEvents.map(async (event) => {
      const args = event.returnValues
      return {
        name: args.name,
        repo: args.repo,
      }
    })
  )

  return packages
}
