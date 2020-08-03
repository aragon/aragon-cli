import { acl } from './acl'
import { useEnvironment } from '../../useEnvironment'
import { TransactionReceipt } from 'web3-core'
import { TransactionRevertInstructionError } from 'web3-core-helpers'

type ProgressHandlerGrantNewVersionsPermission = (
  progressId: number,
  granteeAddressOrTransactionHash?: string
) => void

export async function grantNewVersionsPermission(
  granteeAddresses: string[],
  apmRepoName: string,
  progressHandler: ProgressHandlerGrantNewVersionsPermission | undefined,
  environment: string
): Promise<(TransactionReceipt | TransactionRevertInstructionError)[]> {
  const { web3, provider, gasPrice } = useEnvironment(environment)

  if (granteeAddresses.length === 0) {
    throw new Error('No grantee addresses provided')
  }

  if (progressHandler) progressHandler(1)

  const repoAddress = await provider.resolveName(apmRepoName)
  if (!repoAddress) {
    throw new Error(`Repository ${apmRepoName} does not exist`)
  }

  const receipts: (
    | TransactionReceipt
    | TransactionRevertInstructionError
  )[] = []

  /* eslint-disable-next-line */
  for (const granteeAddress of granteeAddresses) {
    if (progressHandler) progressHandler(2, granteeAddress)

    // Decode sender
    const accounts = await web3.eth.getAccounts()
    const from = accounts[0]

    // Build transaction
    const transaction = await acl(web3).grant(repoAddress, granteeAddress)

    const receipt = await web3.eth.sendTransaction({
      ...transaction,
      from,
      // the recommended gasLimit is already calculated by the ACL module
      gasPrice,
    })
    if (progressHandler && 'transactionHash' in receipt)
      progressHandler(3, receipt.transactionHash)

    receipts.push(receipt)
  }

  return receipts
}
