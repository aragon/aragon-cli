import getApm from './apm'

/**
 * Return packages for a given APM registry.
 *
 * @param {string} apmRegistryName APM registry name
 * @param  {string} environment Envrionment
 * @param {function(number)} progressHandler Progress handler
 * @returns {void}
 */
export default async (
  apmRegistryName,
  environment,
  progressHandler = () => {}
) => {
  const apm = await getApm(environment)

  progressHandler(1)

  const registry = await apm.getRepoRegistry(`vault.${apmRegistryName}`)

  const newRepoEvents = await registry.getPastEvents('NewRepo', {
    fromBlock: 0,
  })

  progressHandler(2)

  const packages = await Promise.all(
    newRepoEvents.map(async event => {
      const args = event.returnValues
      return {
        name: args.name,
        version: (await apm.getLatestVersion(args.id)).version,
      }
    })
  )

  return packages
}
