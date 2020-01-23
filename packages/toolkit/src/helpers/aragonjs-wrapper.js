import Aragon, { ensResolve } from '@aragon/wrapper'
import { takeWhile, map, filter, first, defaultIfEmpty } from 'rxjs/operators'
//
import { addressesEqual } from '../util'
import { noop } from '../node'

// Subscribe to wrapper's observables
const subscribe = (
  wrapper,
  { onApps, onForwarders, onTransaction, onPermissions }
) => {
  const { apps, forwarders, transactions, permissions } = wrapper

  const subscriptions = {
    apps: apps.subscribe(onApps),
    connectedApp: null,
    forwarders: forwarders.subscribe(onForwarders),
    transactions: transactions.subscribe(onTransaction),
    permissions: permissions.subscribe(onPermissions),
  }

  return subscriptions
}

/**
 * Resolve an ens domain
 *
 * @param {string} domain Domain
 * @param {*} opts Options
 * @returns {Promise<string>} Resolved ens domain
 */
export async function resolveEnsDomain(domain, opts) {
  try {
    return await ensResolve(domain, opts)
  } catch (err) {
    if (err.message === 'ENS name not defined.') {
      return ''
    }
    throw err
  }
}

/**
 * Initialize the Aragon.js wrapper and subscribe to the `apps`,
 * `forwarders`, `transactions` and `permissions` observables.
 *
 * @param {string} dao DAO address
 * @param {string} ensRegistryAddress ENS Registry address
 * @param {Object} options Options
 * @param {Object} options.provider Eth provider
 * @param {string} options.gasPrice Gas price
 * @param {string} options.accounts Eth accounts
 * @param {Object} options.ipfsConf IPFS configuration
 * @param {function} options.onApps Apps callback
 * @param {function} options.onForwarders Forwarders callback
 * @param {function} options.onTransaction Transaction callback
 * @param {function} options.onDaoAddress Dao address callback
 * @param {function} options.onPermissions Permissions callback
 * @returns {Promise<Aragon>} Aragon wrapper with an added `cancel` function
 */
export async function initAragonJS(
  dao,
  ensRegistryAddress,
  {
    provider,
    gasPrice,
    accounts = '',
    ipfsConf = {},
    onApps = noop,
    onForwarders = noop,
    onTransaction = noop,
    onDaoAddress = noop,
    onPermissions = noop,
  } = {}
) {
  const isDomain = dao => /[a-z0-9]+\.eth/.test(dao)

  const daoAddress = isDomain(dao)
    ? await resolveEnsDomain(dao, {
        provider,
        registryAddress: ensRegistryAddress,
      })
    : dao

  if (!daoAddress) {
    throw new Error('The provided DAO address is invalid')
  }

  onDaoAddress(daoAddress)

  // TODO: don't reinitialize if cached
  const wrapper = new Aragon(daoAddress, {
    provider,
    defaultGasPriceFn: () => gasPrice,
    apm: {
      ipfs: ipfsConf,
      ensRegistryAddress,
    },
  })

  try {
    await wrapper.init({ accounts: { providedAccounts: accounts } })
  } catch (err) {
    if (err.message === 'connection not open') {
      throw new Error('The wrapper cannot be initialized without a connection')
    }
    throw err
  }

  const subscriptions = subscribe(
    wrapper,
    { onApps, onForwarders, onTransaction, onPermissions },
    { ipfsConf }
  )

  wrapper.cancel = () => {
    Object.values(subscriptions).forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe()
      }
    })
  }

  return wrapper
}

/**
 * Return a list of all installed apps.
 * @param {Aragon} wrapper Aragon wrapper
 * @returns {Promise<Object[]>} Installed apps
 */
export async function getApps(wrapper) {
  return (
    wrapper.apps
      // If the app list contains a single app, wait for more
      .pipe(takeWhile(apps => apps.length <= 1, true))
      .toPromise()
  )
}

/**
 * Get transaction path on an Aragon app for `method` with `params`
 * as parameters. Wait for apps to load before calling
 * wrapper's `getTransactionPath`. If app is the ACL, call
 * `getACLTransactionPath`.
 *
 * @param {string} appAddress App address
 * @param {string} method Method name
 * @param {Array<*>} params Method params
 * @param {Aragon} wrapper Aragon wrapper
 * @returns {Promise<Object>} Transaction path
 */
export async function getTransactionPath(appAddress, method, params, wrapper) {
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
