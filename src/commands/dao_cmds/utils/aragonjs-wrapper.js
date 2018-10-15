import Aragon, {
  ensResolve
} from '@aragon/wrapper'

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
    permissions: permissions.subscribe(onPermissions)
  }

  return subscriptions
}

const resolveEnsDomain = async (domain, opts) => {
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
    onPermissions = noop
  } = {}
) => {
  const isDomain = /[a-z0-9]+\.eth/.test(dao)

  const daoAddress = isDomain
    ? await resolveEnsDomain(dao, {
      provider,
      registryAddress: ensRegistryAddress
    })
    : dao

  if (!daoAddress) {
    onError(new Error('The provided DAO address is invalid'))
    return
  }

  onDaoAddress(daoAddress)

  const wrapper = new Aragon(daoAddress, {
    ensRegistryAddress,
    provider,
    apm: { ipfs: ipfsConf }
  })

  try {
    await wrapper.init(accounts || [accounts])
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
