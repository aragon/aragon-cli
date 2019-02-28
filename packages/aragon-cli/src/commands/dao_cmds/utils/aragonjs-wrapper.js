import Aragon, { ensResolve } from '@aragon/wrapper'

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

const initWrapper = async (
  dao,
  ensRegistryAddress,
  {
    provider,
    accounts = '',
    walletProvider = null,
    ipfsConf = {},
    onError = noop,
    onApps = noop,
    onForwarders = noop,
    onTransaction = noop,
    onDaoAddress = noop,
    onPermissions = noop,
  } = {}
) => {
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
    defaultGasPriceFn: () => String(5e9), // gwei
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

export default initWrapper
