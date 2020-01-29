import Aragon from '@aragon/wrapper'
//
import { noop } from '../node'
import { resolveAddressOrEnsDomain } from '../dao/utils/resolveAddressOrEnsDomain'
import { useEnvironment } from './useEnvironment'

// Subscribe to wrapper's observables
const subscribe = (
  wrapper,
  { onApps, onForwarders, onTransaction, onPermissions }
) => {
  const { apps, forwarders, transactions, permissions } = wrapper

  const subscriptions = {
    connectedApp: null,
    apps: apps.subscribe(onApps),
    forwarders: forwarders.subscribe(onForwarders),
    transactions: transactions.subscribe(onTransaction),
    permissions: permissions.subscribe(onPermissions),
  }

  return subscriptions
}

/**
 * Initialize the Aragon.js wrapper and subscribe to the `apps`,
 * `forwarders`, `transactions` and `permissions` observables.
 *
 * @param {string} dao DAO address
 * @param {string} environment Environment
 * @param {Object} options Options
 * @param {string} options.accounts Eth accounts
 * @param {function} options.onApps Apps callback
 * @param {function} options.onForwarders Forwarders callback
 * @param {function} options.onTransaction Transaction callback
 * @param {function} options.onDaoAddress Dao address callback
 * @param {function} options.onPermissions Permissions callback
 * @returns {Promise<Aragon>} Aragon wrapper with an added `cancel` function
 */
export async function initWrapper(
  dao,
  environment,
  {
    accounts = '',
    onApps = noop,
    onForwarders = noop,
    onTransaction = noop,
    onDaoAddress = noop,
    onPermissions = noop,
  } = {}
) {
  const { wsProvider, web3, apmOptions, gasPrice } = useEnvironment(environment)

  accounts = accounts || (await web3.eth.getAccounts())

  const daoAddress = await resolveAddressOrEnsDomain(dao, environment)

  if (!daoAddress) {
    throw new Error('The provided DAO address is invalid')
  }

  onDaoAddress(daoAddress)

  // TODO: don't reinitialize if cached
  const wrapper = new Aragon(daoAddress, {
    provider: wsProvider || web3.currentProvider,
    defaultGasPriceFn: () => gasPrice,
    apm: apmOptions,
  })

  try {
    await wrapper.init({ accounts: { providedAccounts: accounts } })
  } catch (err) {
    if (err.message === 'connection not open') {
      throw new Error('The wrapper cannot be initialized without a connection')
    }
    throw err
  }

  const subscriptions = subscribe(wrapper, {
    onApps,
    onForwarders,
    onTransaction,
    onPermissions,
  })

  wrapper.cancel = () => {
    Object.values(subscriptions).forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe()
      }
    })
  }

  return wrapper
}
