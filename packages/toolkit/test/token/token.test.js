import test from 'ava'
import sinon from 'sinon'
import miniMeArtifact from '@aragon/apps-shared-minime/build/contracts/MiniMeToken'
//
import * as tokenLib from '../../src/token/token'
import { isAddress, isValidTxHash, getLocalWeb3 } from '../test-helpers'

test.beforeEach(async (t) => {
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

test('deployMiniMeTokenFactory: should deploy the contract with the right args', async (t) => {
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

test('changeControler: should set the correct controller', async (t) => {
  const { web3, accounts } = t.context

  const factory = await tokenLib.deployMiniMeTokenFactory(
    web3,
    accounts[0],
    21,
    () => {}
  )

  const token = await tokenLib.deployMiniMeToken(
    web3,
    accounts[0],
    12,
    'Token name',
    '18',
    'TKN',
    true,
    factory.address,
    () => {}
  )

  const tokenInstance = new web3.eth.Contract(miniMeArtifact.abi, token.address)

  // Make sure the original controller address is valid
  t.is(await tokenInstance.methods.controller().call(), accounts[0])

  const newController = '0x9d1C272D0541345144D943470B3a90f14c56910c'

  await tokenLib.changeController(web3, token.address, newController, 12)

  t.is(await tokenInstance.methods.controller().call(), newController)
})
