import test from 'ava'
import web3EthAbi from 'web3-eth-abi'
import { expandLink } from '@aragon/toolkit/dist/util'
//
import { deployContract, linkLibraries } from '../../src/lib/deploy/deploy'
import { isAddress, isValidTxHash, getLocalWeb3 } from '../util'

test.beforeEach(async t => {
  t.context = {
    web3: await getLocalWeb3(),
  }
})

test('should deploy a sample contract', async t => {
  const bytecode =
    '0x6080604052348015600f57600080fd5b50604051602080607b83398101806040528101908080519060200190929190505050806000819055505060358060466000396000f3006080604052600080fd00a165627a7a723058201ce94d3e26f88856f75379414685482f1a13c4d8afc0d8d167c6f69e8de1417f0029'
  const abi = [
    {
      inputs: [{ name: '_value', type: 'int256' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
  ]
  const sampleUint = 11
  const initArguments = [sampleUint]
  const gasPrice = 1e9
  const constructorArgumentsEncoded = web3EthAbi
    .encodeParameter('uint256', String(sampleUint))
    .replace('0x', '')

  // arrange
  const { web3 } = t.context
  // act
  const result = await deployContract({
    bytecode,
    abi,
    initArguments,
    gasPrice,
    web3,
  })
  // assert
  const tx = await web3.eth.getTransaction(result.transactionHash)

  t.snapshot(tx.input, 'the deploy bytecode is correct')
  t.is(tx.input, bytecode + constructorArgumentsEncoded)
  t.true(isValidTxHash(result.transactionHash))
  t.true(isAddress(result.address))
})

test('Deploy > linkLibraries', t => {
  const link = {
    name: 'Library1',
    address: '0x1111111111111111111111111111111111111111',
  }
  const links = [link]

  const sampleHex =
    '5300541194335152988749892502228755547482451690626856874364818603877859370'

  const bytecode = [
    '0x',
    sampleHex,
    expandLink(link).placeholder,
    sampleHex,
  ].join('')

  const bytecodeWithLibraries = linkLibraries(bytecode, links)

  t.is(
    bytecodeWithLibraries,
    ['0x', sampleHex, link.address.slice(2), sampleHex].join('')
  )
})
