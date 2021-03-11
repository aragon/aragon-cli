import sinon from 'sinon'
//
import { getLocalWeb3 } from '../test-helpers'
import { getContract } from '../../src/util'
import {
  deployMiniMeTokenFactory,
  deployMiniMeToken,
} from '../../src/token/token'

jest.setTimeout(60000)
let web3
beforeEach(async () => {
  web3 = await getLocalWeb3()
})

afterEach(async () => {
  await web3.currentProvider.connection.close()
})

test('deployMiniMeTokenFactory: should deploy the contract', async () => {
  const progressCallback = sinon.stub()

  const receipt = await deployMiniMeTokenFactory(
    web3,
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    21,
    progressCallback
  )

  expect(receipt.txHash !== undefined).toBe(true)
  expect(web3.utils.isAddress(receipt.address)).toBe(true)
  expect(progressCallback.callCount).toBe(3)
})

test('deployMiniMeToken: should deploy the contract', async () => {
  const tokenName = 'Token name test'
  const tokenSymbol = 'TKN'
  const decimalUnits = '12'

  const progressCallback = sinon.stub()

  const factory = await deployMiniMeTokenFactory(
    web3,
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    21,
    () => {}
  )

  const receipt = await deployMiniMeToken(
    web3,
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    0,
    tokenName,
    decimalUnits,
    tokenSymbol,
    true,
    factory.address,
    progressCallback
  )

  expect(receipt.txHash !== undefined).toBe(true)
  expect(web3.utils.isAddress(receipt.address)).toBe(true)
  expect(progressCallback.callCount).toBe(3)

  const tokenJson = await getContract(
    '@aragon/apps-shared-minime',
    'MiniMeToken'
  )

  const token = new web3.eth.Contract(tokenJson.abi, receipt.address)
  expect(tokenName).toBe(await token.methods.name().call())
  expect(tokenSymbol).toBe(await token.methods.symbol().call())
  expect(decimalUnits).toBe(await token.methods.decimals().call())
})
