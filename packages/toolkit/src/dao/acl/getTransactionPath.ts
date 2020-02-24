import { takeWhile, map, filter, first, defaultIfEmpty } from 'rxjs/operators'
//
import { initWrapper } from '../utils/wrapper'
import { addressesEqual } from '../../utils/addresses'
import { AragonApp } from '../../types'

type TransactionPath = any

/**
 * Get transaction path on an Aragon app for `method` with `params`
 * as parameters. Wait for apps to load before calling
 * wrapper's `getTransactionPath`. If app is the ACL, call
 * `getACLTransactionPath`.
 *
 * @param dao DAO address
 * @param appAddress App address
 * @param method Method name
 * @param params Method params
 * @param environment Envrionment
 * @returns Transaction path
 */
export async function getTransactionPath(
  dao: string,
  appAddress: string,
  method: string,
  params: any[],
  environment: string
): Promise<TransactionPath> {
  const wrapper = await initWrapper(dao, environment)

  // Wait for app info to load
  const app = await wrapper.apps
    .pipe(
      // If the app list contains a single app, wait for more
      takeWhile((apps: AragonApp[]) => apps.length <= 1, true),
      map((apps: AragonApp[]) =>
        apps.find(app => addressesEqual(appAddress, app.proxyAddress))
      ),
      filter((app: AragonApp | undefined) => Boolean(app)),
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
