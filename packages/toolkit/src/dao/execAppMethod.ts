import { getTransactionPath } from './acl/getTransactionPath'
import { useEnvironment } from '../helpers/useEnvironment'
import { TransactionReceipt } from 'web3-core'
import { TransactionRevertInstructionError } from 'web3-core-helpers'

/**
 * Execute a method on a DAO's app.
 *
 * @param dao DAO name or address
 * @param app App address
 * @param method Method name
 * @param params Method parameters
 * @param progressHandler Progress handler
 * @param environment Environment
 * @returns Transaction path and receipt
 */
export default async function execAppMethod(
  dao: string,
  app: string,
  method: string,
  params: any[],
  progressHandler: (progressId: number) => void = () => {},
  environment: string
): Promise<{
  transactionPath: string
  receipt: TransactionReceipt | TransactionRevertInstructionError
}> {
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
