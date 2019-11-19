import test from 'ava'
import sinon from 'sinon'
import * as tokenLib from '../../src/lib/token'
import { isAddress, isValidTxHash, getLocalWeb3 } from './test-utils'

test.beforeEach(async t => {
  const web3 = await getLocalWeb3()
  const accounts = await web3.eth.getAccounts()

  t.context = {
    web3,
    accounts,
  }
})

test.afterEach.always(() => {
  sinon.restore()
})

test('deployMiniMeTokenFactory: should deploy the contract with the right args', async t => {
  t.plan(5)
  // arrange
  const { web3, accounts } = t.context
  // act
  const result = await tokenLib.deployMiniMeTokenFactory(
    web3,
    accounts[0],
    21,
    () => {}
  )
  // assert
  t.true(isValidTxHash(result.txHash))
  t.true(isAddress(result.address))

  const tx = await web3.eth.getTransaction(result.txHash)
  t.snapshot(tx.input, 'the MiniMeTokenFactory bytecode is correct')
  t.snapshot(tx.gasPrice, 'the transaction gas price is correct')
  t.snapshot(tx.gas, 'the transaction gas is correct')
})
