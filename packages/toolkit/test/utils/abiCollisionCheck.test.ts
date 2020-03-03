import test from 'ava'
import { checkSignatureCollisionsWithProxy } from '../../src/utils/abiCollisionCheck'
import sinon from 'sinon'
import { AbiItem } from 'web3-utils'

const mockAbi: AbiItem[] = [
  {
    constant: false,
    inputs: [],
    name: 'proxyType',
    outputs: [
      {
        name: 'proxyTypeId',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const logSpy = sinon.spy(console, 'log')

test.after('cleanup', t => {
  logSpy.restore()
})

test('should generate artifact and warn of collisions', async t => {
  await checkSignatureCollisionsWithProxy(mockAbi)
  t.assert(logSpy.calledWithMatch('WARNING: Collisions'))
})
