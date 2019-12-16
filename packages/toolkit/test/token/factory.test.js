import test from 'ava'
import sinon from 'sinon'
//
import { getLocalWeb3 } from '../test-helpers'
import { getContract } from '../../src/util'
import {
  deployMiniMeTokenFactory,
  deployMiniMeToken,
} from '../../src/token/token'

test('deployMiniMeTokenFactory: should deploy the contract', async t => {
  const web3 = await getLocalWeb3()
  const progressCallback = sinon.stub()

  const receipt = await deployMiniMeTokenFactory(
    web3,
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    21,
    progressCallback
  )

  t.true(receipt.txHash !== undefined)
  t.true(web3.utils.isAddress(receipt.address))
  t.is(progressCallback.callCount, 3)
})

test('deployMiniMeToken: should deploy the contract', async t => {
  const tokenName = 'Token name test'
  const tokenSymbol = 'TKN'
  const decimalUnits = '12'

  const web3 = await getLocalWeb3()
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

  t.true(receipt.txHash !== undefined)
  t.true(web3.utils.isAddress(receipt.address))
  t.is(progressCallback.callCount, 3)

  const tokenJson = await getContract(
    '@aragon/apps-shared-minime',
    'MiniMeToken'
  )

  const token = new web3.eth.Contract(tokenJson.abi, receipt.address)
  t.is(tokenName, await token.methods.name().call())
  t.is(tokenSymbol, await token.methods.symbol().call())
  t.is(decimalUnits, await token.methods.decimals().call())
})
