import test from 'ava'
import fs from 'fs'
import path from 'path'
import { AragonAppJson } from '../../src/publish/types'
import { AragonContractFunction } from '../../src/solidityParsers/parseContractFunctions'
import { AbiItem } from 'web3-utils'
//
import matchContractRoles from '../../src/publish/matchContractRoles'

const roles = [
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
]

test('matchContractRoles - should match', t => {
  const functions = [
    {
      name: 'newImmediatePayment',
      notice: '',
      paramTypes: ['address', 'address', 'uint256', 'string'],
      roles: [{ id: 'CREATE_PAYMENTS_ROLE', paramCount: 6 }],
    },
  ]

  const errors = matchContractRoles(functions, roles)

  t.deepEqual(errors, [])
})

test('matchContractRoles - should not find usage', t => {
  const functions = [
    {
      name: 'newImmediatePayment',
      notice: '',
      paramTypes: ['address', 'address', 'uint256', 'string'],
      roles: [],
    },
  ]

  const errors = matchContractRoles(functions, roles)

  t.deepEqual(errors, [
    {
      id: 'CREATE_PAYMENTS_ROLE',
      message: 'Role not used in contract',
    },
  ])
})

test('matchContractRoles - should find different count', t => {
  const functions = [
    {
      name: 'newImmediatePayment',
      notice: '',
      paramTypes: ['address', 'address', 'uint256', 'string'],
      roles: [{ id: 'CREATE_PAYMENTS_ROLE', paramCount: 0 }],
    },
  ]

  const errors = matchContractRoles(functions, roles)

  t.deepEqual(errors, [
    {
      id: 'CREATE_PAYMENTS_ROLE',
      message: 'Role has 6 declared params but contract uses 0',
    },
  ])
})
