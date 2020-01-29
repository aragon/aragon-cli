import test from 'ava'
//
import ACL from '../../src/acl/acl'
import { useEnvironment } from '../../src/helpers/useEnvironment'
import { resolveEnsDomain } from '../../src/helpers/resolveAddressOrEnsDomain'

/**
 * ############## TODO
 * Refactor /lib/apm/util/acl
 * Its functions could be made a pure function that will not require
 * a complex integration test like this
 */

test.beforeEach(async t => {
  const { web3 } = useEnvironment()

  const accounts = await web3.eth.getAccounts()

  t.context = {
    web3,
    accounts,
  }
})

test('Should prepare a TX to grant permissions to an account', async t => {
  // arrange
  const { web3, accounts } = t.context

  const financeAppAddress = await resolveEnsDomain('finance.aragonpm.eth')

  const repoAddress = financeAppAddress
  const granteeAddress = accounts[1]

  // act
  const acl = ACL(web3)
  const transaction = await acl.grant(repoAddress, granteeAddress)

  // assert
  t.snapshot(transaction, 'the transaction data is correct')
})
