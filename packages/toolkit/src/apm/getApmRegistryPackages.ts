import getApm from './apm'

/**
 * Return packages for a given APM registry.
 *
 * @param apmRegistryName APM registry name
 * @param progressHandler Progress handler
 * @param environment Envrionment
 * @returns
 */
export default async function getApmRegistryPackages(
  apmRegistryName: string,
  progressHandler: (progressId: number) => void | undefined,
  environment: string
): Promise<any> {
  const apm = await getApm(environment)

  if (progressHandler) progressHandler(1)

  const registry = await apm.getRepoRegistry(`vault.${apmRegistryName}`)
  const newRepoEvents = await registry.getPastEvents('NewRepo', {
    fromBlock: 0,
  })

  if (progressHandler) progressHandler(2)

  const packages = await Promise.all(
    newRepoEvents.map(async (event: any) => {
      const args = event.returnValues
      return {
        name: args.name,
        version: (await apm.getLatestVersion(args.id)).version,
      }
    })
  )

  return packages
}
