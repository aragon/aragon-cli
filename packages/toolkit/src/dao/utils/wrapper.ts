import { resolveDaoAddressOrEnsDomain } from '../../utils/resolvers'
import { useEnvironment } from '../../helpers/useEnvironment'
// Note: Must use require because '@aragon/wrapper' is an untyped library
// without type definitions or @types/@aragon/wrapper
/* eslint-disable @typescript-eslint/no-var-requires */
const Aragon = require('@aragon/wrapper')

/**
 * Initialize the Aragon.js wrapper and subscribe to the `apps`,
 * `forwarders`, `transactions` and `permissions` observables.
 *
 * @param dao DAO address
 * @param environment Environment
 * @param options Options
 * @returns  Aragon wrapper with an added `cancel` function
 */
export async function initWrapper(
  dao: string,
  environment: string,
  options?: {
    accounts?: string[]
    onApps?: (apps: any) => void
    onForwarders?: (forwarders: any) => void
    onTransaction?: (transaction: any) => void
    onDaoAddress?: (daoAddress: string) => void
    onPermissions?: (permissions: any) => void
  }
): Promise<any> {
  const {
    accounts: defaultAccounts,
    onApps,
    onForwarders,
    onTransaction,
    onDaoAddress,
    onPermissions,
  } = options || {}

  const { wsProvider, web3, apmOptions, gasPrice } = useEnvironment(environment)

  const accounts = defaultAccounts || (await web3.eth.getAccounts())

  const daoAddress = await resolveDaoAddressOrEnsDomain(dao, environment)

  if (!daoAddress) {
    throw new Error('The provided DAO address is invalid')
  }

  if (onDaoAddress) onDaoAddress(daoAddress)

  // TODO: don't reinitialize if cached
  const wrapper = new Aragon(daoAddress, {
    provider: wsProvider || web3.currentProvider,
    defaultGasPriceFn: (): string => gasPrice,
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

  const subs: { unsubscribe: () => void }[] = []
  if (onApps) subs.push(wrapper.apps.subscribe(onApps))
  if (onForwarders) subs.push(wrapper.forwarders.subscribe(onForwarders))
  if (onTransaction) subs.push(wrapper.transactions.subscribe(onTransaction))
  if (onPermissions) subs.push(wrapper.permissions.subscribe(onPermissions))

  wrapper.cancel = (): void => {
    for (const subscription of subs)
      if (subscription) subscription.unsubscribe()
  }

  return wrapper
}
