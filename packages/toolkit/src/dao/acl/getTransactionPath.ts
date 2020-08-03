import { connect } from '@aragon/connect'
import { useEnvironment } from '../../useEnvironment'

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
  account: string,
  environment: string
): Promise<TransactionPath> {
  const { chainId } = useEnvironment(environment)

  const org = await connect(dao, 'thegraph', { chainId })

  const intent = org.appIntent(appAddress, method, params)

  return intent.paths(account)
}
