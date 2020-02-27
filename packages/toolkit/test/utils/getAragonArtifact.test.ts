import test from 'ava'
import { AragonAppJson } from '../../src/types'
import { AragonContractFunction } from '../../src/utils/parseContractFunctions'
import { AbiItem } from 'web3-utils'
//
import getAragonArtifact from '../../src/utils/getAragonArtifact'

/* Tests */
test('getAragonArtifact', t => {
  const arapp: AragonAppJson = {
    environments: {
      mainnet: {
        registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        appName: 'finance.aragonpm.eth',
        network: 'mainnet',
      },
    },
    roles: [
      {
        name: 'Create new payments',
        id: 'CREATE_PAYMENTS_ROLE',
        params: [
          'Token address',
          'Receiver address',
          'Token amount',
          'Payment interval',
          'Max repeats',
          'Initial payment time',
        ],
      },
    ],
    path: 'contracts/Finance.sol',
  }

  const functions: AragonContractFunction[] = [
    {
      name: 'newImmediatePayment',
      notice: '',
      paramTypes: ['address', 'address', 'uint256', 'string'],
      roles: [{ id: 'CREATE_PAYMENTS_ROLE', paramCount: 6 }],
    },
  ]

  const newImmediatePaymentAbi: AbiItem = {
    constant: false,
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_receiver', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_reference', type: 'string' },
    ],
    name: 'newImmediatePayment',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  }

  const abi: AbiItem[] = [newImmediatePaymentAbi]

  const artifact = getAragonArtifact(arapp, functions, abi)

  console.log(JSON.stringify(artifact, null, 2))

  t.deepEqual(artifact, {
    environments: {
      mainnet: {
        registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        appName: 'finance.aragonpm.eth',
        network: 'mainnet',
        appId:
          '0xbf8491150dafc5dcaee5b861414dca922de09ccffa344964ae167212e8c673ae',
      },
    },
    roles: [
      {
        name: 'Create new payments',
        id: 'CREATE_PAYMENTS_ROLE',
        params: [
          'Token address',
          'Receiver address',
          'Token amount',
          'Payment interval',
          'Max repeats',
          'Initial payment time',
        ],
        bytes:
          '0x5de467a460382d13defdc02aacddc9c7d6605d6d4e0b8bd2f70732cae8ea17bc',
      },
    ],
    functions: [
      {
        roles: ['CREATE_PAYMENTS_ROLE'],
        notice: '',
        abi: newImmediatePaymentAbi,
      },
    ],
    path: 'contracts/Finance.sol',
    abi,
    // Additional metadata for accountability
    flattenedCode: './code.sol',
  })
})
