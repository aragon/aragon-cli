import ACL from '../../../src/apm/util/acl'
import { resolveEnsDomain } from '../../../src/helpers/aragonjs-wrapper'
import { getLocalWeb3 } from '../../test-helpers'

/**
 * ############## TODO
 * Refactor /lib/apm/util/acl
 * Its functions could be made a pure function that will not require
 * a complex integration test like this
 */

jest.setTimeout(60000)
const ensRegistryAddress = '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'
let context
beforeEach(async () => {
  const web3 = await getLocalWeb3()
  const accounts = await web3.eth.getAccounts()

  context = {
    web3,
    accounts,
  }
})

test('Should prepare a TX to grant permissions to an account', async () => {
  // arrange
  const { web3, accounts } = context

  const financeAppAddress = await resolveEnsDomain('finance.aragonpm.eth', {
    provider: web3.currentProvider,
    registryAddress: ensRegistryAddress,
  })

  const repoAddress = financeAppAddress
  const granteeAddress = accounts[1]

  // act
  const acl = ACL(web3)
  const transaction = await acl.grant(repoAddress, granteeAddress)

  delete transaction.gas

  // assert
  expect(transaction).toMatchSnapshot('the transaction data is correct')
})
