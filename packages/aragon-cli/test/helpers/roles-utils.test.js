import test from 'ava'
import path from 'path'
import {
  getArappRoles,
  diffRolesBetweenContractAndArapp,
} from '../../src/helpers/roles-utils'

const financeSamples = '../sample-apps/finance'

test('Roles utils > Assert correct roles between contract and arapp.json', t => {
  t.plan(1)

  const artifPath = path.resolve(__dirname, financeSamples, 'Finance.json')
  const arappPath = path.resolve(__dirname, financeSamples, 'arapp.json')
  const arappRoles = getArappRoles(arappPath)

  const errors = diffRolesBetweenContractAndArapp(artifPath, arappRoles)
  t.deepEqual(errors, [])
})

test('Roles utils > Assert wrong roles between contract and arapp.json', t => {
  t.plan(1)

  const artifPath = path.resolve(__dirname, financeSamples, 'Finance.json')
  const arappPath = path.resolve(__dirname, financeSamples, 'arapp-bad.json')
  const arappRoles = getArappRoles(arappPath)

  const errors = diffRolesBetweenContractAndArapp(artifPath, arappRoles)
  t.deepEqual(errors, [
    'EXTRA_UNUSED_ROLE is declared but never used',
    'Function executePayment uses undeclared role EXECUTE_PAYMENTS_ROLE',
    'Function setPaymentStatus uses MANAGE_PAYMENTS_ROLE with 2 params but requires 3',
  ])
})
