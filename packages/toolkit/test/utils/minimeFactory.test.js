import test from 'ava'
import sinon from 'sinon'
import { isAddress } from 'web3-utils'
//
import { getContract } from '../../src/util'
import { useEnvironment } from '../../src/helpers/useEnvironment'
import {
  deployMiniMeTokenFactory,
  deployMiniMeToken,
} from '../../src/utils/token'

test('deployMiniMeTokenFactory: should deploy the contract', async t => {
  const progressHandler = sinon.stub()

  const receipt = await deployMiniMeTokenFactory(
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    progressHandler
  )

  t.true(receipt.txHash !== undefined)
  t.true(isAddress(receipt.address))
  t.is(progressHandler.callCount, 3)
})

test('deployMiniMeToken: should deploy the contract', async t => {
  const { web3 } = useEnvironment()

  const tokenName = 'Token name test'
  const tokenSymbol = 'TKN'
  const decimalUnits = '12'

  const progressHandler = sinon.stub()

  const factory = await deployMiniMeTokenFactory(
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    progressHandler
  )

  const receipt = await deployMiniMeToken(
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    tokenName,
    decimalUnits,
    tokenSymbol,
    true,
    factory.address,
    progressHandler
  )

  t.true(receipt.txHash !== undefined)
  t.true(isAddress(receipt.address))
  t.is(progressHandler.callCount, 6)

  const tokenJson = await getContract(
    '@aragon/apps-shared-minime',
    'MiniMeToken'
  )

  const token = new web3.eth.Contract(tokenJson.abi, receipt.address)
  t.is(tokenName, await token.methods.name().call())
  t.is(tokenSymbol, await token.methods.symbol().call())
  t.is(decimalUnits, await token.methods.decimals().call())
})
