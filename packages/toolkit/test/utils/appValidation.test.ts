import test from 'ava'
import sinon from 'sinon'
import { AbiItem } from 'web3-utils'
import proxyquire from 'proxyquire'
const { validateApp } = proxyquire('../../src/utils/appValidation', {
  fs: {
    readFileSync: () => {},
  },
  './parseContractFunctions': {
    parseGlobalVariableAssignments: () => ['test'],
    parseConstructorAssignments: () => ['test2'],
  },
})

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
  await validateApp(mockAbi, '')
  t.assert(logSpy.calledWithMatch('WARNING: Collisions'))
})

test('should warn of global variable assignments', async t => {
  await validateApp(mockAbi, '')
  t.assert(logSpy.calledWithMatch('WARNING: Global state'))
})