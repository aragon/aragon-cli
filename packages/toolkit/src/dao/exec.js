import { getTransactionPath } from './permissions'
import { useEnvironment } from '../helpers/useEnvironment'

/**
 * Execute a method on a DAO's app.
 *
 * @param {string} dao DAO name or address
 * @param {string} app App address
 * @param {string} method Method name
 * @param {Array<*>} params Method parameters
 * @param {string} environment Environment
 * @param {function} progressHandler Progress handler
 * @returns {Promise<{ transactionPath, receipt }>} Transaction path and receipt
 */
export default async function(
  dao,
  app,
  method,
  params,
  environment,
  progressHandler = () => {}
) {
  const { web3 } = useEnvironment(environment)

  progressHandler(1)

  const transactionPath = (
    await getTransactionPath(dao, app, method, params, environment)
  )[0]

  if (!transactionPath)
    throw new Error('Cannot find transaction path for executing action')

  progressHandler(2)

  return {
    transactionPath,
    receipt: await web3.eth.sendTransaction(transactionPath),
  }
}
