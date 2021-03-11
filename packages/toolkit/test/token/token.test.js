import sinon from 'sinon'
import miniMeArtifact from '@aragon/apps-shared-minime/build/contracts/MiniMeToken'
//
import * as tokenLib from '../../src/token/token'
import { isAddress, isValidTxHash, getLocalWeb3 } from '../test-helpers'

jest.setTimeout(60000)
let context, web3
beforeEach(async () => {
  web3 = await getLocalWeb3()
  const accounts = await web3.eth.getAccounts()

  context = {
    web3,
    accounts,
  }
})

afterAll(async () => {
  await web3.currentProvider.connection.close()
})

test('sinon.restore()', () => {
  sinon.restore()
})

test('deployMiniMeTokenFactory: should deploy the contract with the right args', async () => {
  // arrange
  const { web3, accounts } = context
  // act
  const result = await tokenLib.deployMiniMeTokenFactory(
    web3,
    accounts[0],
    21,
    () => {}
  )
  // assert
  expect(isValidTxHash(result.txHash)).toBe(true)
  expect(isAddress(result.address)).toBe(true)

  const tx = await web3.eth.getTransaction(result.txHash)
  expect(tx.input).toMatchSnapshot('the MiniMeTokenFactory bytecode is correct')
  expect(tx.gasPrice).toMatchSnapshot('the transaction gas price is correct')
  expect(tx.gas).toMatchSnapshot('the transaction gas is correct')
})

test('changeControler: should set the correct controller', async () => {
  const { web3, accounts } = context

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
  expect(await tokenInstance.methods.controller().call()).toBe(accounts[0])

  const newController = '0x9d1C272D0541345144D943470B3a90f14c56910c'

  await tokenLib.changeController(web3, token.address, newController, 12)

  expect(await tokenInstance.methods.controller().call()).toBe(newController)
})
