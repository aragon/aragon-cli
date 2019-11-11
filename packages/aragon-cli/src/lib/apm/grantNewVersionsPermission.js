const APM = require('@aragon/apm')
const ACL = require('./util/acl')

module.exports = async (web3, apmRepoName, apmOptions, gasPrice, grantees, progressHandler) => {
  if (grantees.length === 0) {
    throw new Error('No grantee addresses provided')
  }

  if (progressHandler) {
    progressHandler(1)
  }

  // Ensure the ens-registry property is present,
  // and available with the name "ensRegistryAddress".
  if (!apmOptions.ensRegistryAddress) {
    if (apmOptions['ens-registry']) {
      apmOptions.ensRegistryAddress = apmOptions['ens-registry']
    } else {
      throw new Error('ens-registry not found in given apm options.')
    }
  }

  const apm = await APM(web3, apmOptions)
  const acl = ACL(web3)

  if (progressHandler) {
    progressHandler(2)
  }

  const repo = await apm.getRepository(apmRepoName).catch(() => null)
  if (repo === null) {
    throw new Error(
      `Repository ${apmRepoName} does not exist and it's registry does not exist`
    )
  }

  /* eslint-disable-next-line */
  for (const address of grantees) {
    if (progressHandler) {
      progressHandler(3, address)
    }

    // Decode sender
    const accounts = await web3.eth.getAccounts()
    const from = accounts[0]

    // Build transaction
    const transaction = await acl.grant(repo.options.address, address)

    transaction.from = from
    transaction.gasPrice = gasPrice
    // the recommended gasLimit is already calculated by the ACL module

    try {
      const receipt = await web3.eth.sendTransaction(transaction)
      if (progressHandler) {
        progressHandler(4, receipt.transactionHash)
      }
    } catch (e) {
      if (progressHandler) {
        progressHandler(5, 'Transaction failed')
      }
      process.exit(1)
    }
  }

  if (progressHandler) {
    progressHandler(6)
  }

  process.exit(0)
}
