import { takeWhile } from 'rxjs/operators'
//
import { useEnvironment } from '../../helpers/useEnvironment'
import { initWrapper } from '../utils/wrapper'
import { kernelAbi } from '../../contractAbis'

type AragonApp = any

/**
 * Return installed apps for a DAO
 *
 * @param dao DAO address
 * @param environment Envrionment
 * @returns Installed apps
 */
export async function getInstalledApps(
  dao: string,
  environment: string
): Promise<AragonApp[]> {
  const wrapper = await initWrapper(dao, environment)
  return (
    wrapper.apps
      // If the app list contains a single app, wait for more
      .pipe(takeWhile((apps: AragonApp[]) => apps.length <= 1, true))
      .toPromise()
  )
}

/**
 * Return all apps in a DAO, including permissionless ones
 *
 * @param dao DAO address
 * @param environment Envrionment
 * @returns All apps
 */
export async function getAllApps(
  dao: string,
  environment: string
): Promise<
  {
    proxyAddress: string
    appId: string
  }[]
> {
  const { web3 } = useEnvironment(environment)

  const kernel = new web3.eth.Contract(kernelAbi, dao)

  const events = await kernel.getPastEvents('NewAppProxy', {
    fromBlock: await kernel.methods.getInitializationBlock().call(),
    toBlock: 'latest',
  })

  return events.map(event => ({
    proxyAddress: event.returnValues.proxy,
    appId: event.returnValues.appId,
  }))
}
