import test from 'ava'
import { AbiItem } from 'web3-utils'
import proxyquire from 'proxyquire'
const { validateApp } = proxyquire('../../src/utils/appValidation', {
  fs: {
    readFileSync: () => {
      return undefined
    },
  },
  './parseContractFunctions': {
    parseGlobalVariableAssignments: () => ['test'],
    hasConstructor: () => true,
  },
})

const invalidAbi: AbiItem[] = [
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

test('should find collisions and throw error', async t => {
  try {
    await validateApp(invalidAbi, '')
  } catch (e) {
    t.assert(e.message.match('Collisions'))
  }
})
