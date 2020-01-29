import { takeWhile, map, filter, first, defaultIfEmpty } from 'rxjs/operators'
//
import { initWrapper } from '../helpers/wrapper'
import { addressesEqual } from '../util'

/**
 * Get transaction path on an Aragon app for `method` with `params`
 * as parameters. Wait for apps to load before calling
 * wrapper's `getTransactionPath`. If app is the ACL, call
 * `getACLTransactionPath`.
 *
 * @param {string} dao DAO address
 * @param {string} appAddress App address
 * @param {string} method Method name
 * @param {Array<*>} params Method params
 * @param {string} environment Envrionment
 * @returns {Promise<Object>} Transaction path
 */
export async function getTransactionPath (dao, appAddress, method, params, environment) {
  const wrapper = await initWrapper(dao, environment)

  // Wait for app info to load
  const app = await wrapper.apps
    .pipe(
      // If the app list contains a single app, wait for more
      takeWhile(apps => apps.length <= 1, true),
      map(apps =>
        apps.find(app => addressesEqual(appAddress, app.proxyAddress))
      ),
      filter(app => app),
      defaultIfEmpty(null), // If app is not found, default to null
      first()
    )
    .toPromise()

  if (!app) throw new Error(`Can't find app ${appAddress}.`)

  // If app is the ACL, call getACLTransactionPath
  return appAddress === wrapper.aclProxy.address
    ? wrapper.getACLTransactionPath(method, params)
    : wrapper.getTransactionPath(appAddress, method, params)
}
