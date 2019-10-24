import Aragon, { ensResolve } from '@aragon/wrapper'
const { takeWhile, map, filter, first } = require('rxjs/operators')
const { addressesEqual } = require('../../../util')
const noop = () => {}

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

export async function initAragonJS(
  dao,
  ensRegistryAddress,
  {
    provider,
    gasPrice,
    accounts = '',
    ipfsConf = {},
    onError = noop,
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
    onError(new Error('The provided DAO address is invalid'))
    return
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
      onError(
        new Error('The wrapper can not be initialized without a connection')
      )
      return
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
 * Get transaction path on an Aragon app for `method` with `params` 
 * as parameters. 
 * @param {string} appAddress App address
 * @param {string} method Method name
 * @param {string[]} params Method params
 * @param {Aragon} wrapper Aragon wrapper
 */
export async function getTransactionPath(appAddress, method, params, wrapper) {
  // Wait for app info to load
  await wrapper.apps
    .pipe(
      map(apps => apps.find(app => addressesEqual(appAddress, app.proxyAddress))),
      filter(app => app),
      first()
    )
    .toPromise()

  // If app is the ACL, call getACLTransactionPath
  return appAddress === wrapper.aclProxy.address
    ? wrapper.getACLTransactionPath(method, params)
    : wrapper.getTransactionPath(appAddress, method, params)
}

/**
 * Return a list of all installed apps
 * @param {Aragon} wrapper Aragon wrapper
 * @returns {Promise<Object[]>} Installed apps
 */
export async function getApps(wrapper) {
  return wrapper.apps
    // The first element of the apps stream is sometimes the kernel alone.
    // If this is the case, continue.
    .pipe(takeWhile(apps => apps.length <= 1, true))
    .toPromise()
}



