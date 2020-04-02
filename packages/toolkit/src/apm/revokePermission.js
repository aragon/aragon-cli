import APM from '@aragon/apm'
import ACL from './util/acl'

export default async (
  web3,
  apmRepoName,
  apmOptions,
  entity,
  progressHandler = () => {},
  { gasPrice }
) => {
  if (entity.length === 0) {
    throw new Error('No addresse provided')
  }

  const apm = await APM(web3, apmOptions)
  const acl = ACL(web3)

  progressHandler(1)

  const repo = await apm.getRepository(apmRepoName)
  if (repo === null) {
    throw new Error(
      `Repository ${apmRepoName} does not exist and it's registry does not exist`
    )
  }


  /* eslint-disable-next-line */
  progressHandler(2, entity)

  // Decode sender
  const accounts = await web3.eth.getAccounts()
  const from = accounts[0]

  // Build transaction
  const transaction = await acl.revoke(repo.options.address, entity, from)

  transaction.from = from
  transaction.gasPrice = gasPrice
  // the recommended gasLimit is already calculated by the ACL module

  const receipt = await web3.eth.sendTransaction(transaction)
  progressHandler(3, receipt.transactionHash)

  return receipt
}
