import test from 'ava'
import path from 'path'
import { extractRoles } from '../../src/helpers/ast-extractor'

test('Ast extractor > Parse Finance app', t => {
  t.plan(1)

  const financeRoles = extractRoles(
    path.resolve(__dirname, './sample-contracts/Finance.json')
  )

  t.deepEqual(financeRoles, [
    {
      name: 'CREATE_PAYMENTS_ROLE',
      params: [
        '_token',
        '_receiver',
        '_amount',
        'MAX_UINT256',
        '1',
        'getTimestamp()',
      ],
      functionName: 'newImmediatePayment',
    },
    {
      name: 'CREATE_PAYMENTS_ROLE',
      params: [
        '_token',
        '_receiver',
        '_amount',
        '_interval',
        '_maxExecutions',
        '_initialPaymentTime',
      ],
      functionName: 'newScheduledPayment',
    },
    {
      name: 'CHANGE_PERIOD_ROLE',
      params: ['_periodDuration', 'periodDuration'],
      functionName: 'setPeriodDuration',
    },
    {
      name: 'CHANGE_BUDGETS_ROLE',
      params: ['_token', '_amount', 'budgets', 'flag'],
      functionName: 'setBudget',
    },
    {
      name: 'CHANGE_BUDGETS_ROLE',
      params: ['_token', '0', 'budgets', 'flag'],
      functionName: 'removeBudget',
    },
    {
      name: 'EXECUTE_PAYMENTS_ROLE',
      params: ['_paymentId', 'amount'],
      functionName: 'executePayment',
    },
    {
      name: 'MANAGE_PAYMENTS_ROLE',
      params: ['_paymentId', 'flag'],
      functionName: 'setPaymentStatus',
    },
  ])
})

test('Ast extractor > Parse Voting app', t => {
  t.plan(1)

  const votingRoles = extractRoles(
    path.resolve(__dirname, './sample-contracts/Voting.json')
  )
  t.deepEqual(votingRoles, [
    {
      name: 'MODIFY_SUPPORT_ROLE',
      params: ['_supportRequiredPct', 'supportRequiredPct'],
      functionName: 'changeSupportRequiredPct',
    },
    {
      name: 'MODIFY_QUORUM_ROLE',
      params: ['_minAcceptQuorumPct', 'minAcceptQuorumPct'],
      functionName: 'changeMinAcceptQuorumPct',
    },
    { name: 'CREATE_VOTES_ROLE', params: [], functionName: 'newVote' },
    { name: 'CREATE_VOTES_ROLE', params: [], functionName: 'newVote' },
  ])
})

// t.deepEqual(functions, [
//   { sig: 'fallback', roles: [], notice: 'fallback function notive' },
//   {
//     sig: 'noAuthFunction(address,uint256)',
//     roles: [],
//     notice: 'Function with no auth modifier',
//   },
//   {
//     sig: 'withAuthMultiline(address,uint256)',
//     roles: ['FIRST_ROLE'],
//     notice: 'Function with auth modifier multiline',
//   },
//   {
//     sig: 'withAuthSingleline(address,uint256)',
//     roles: ['SECOND_ROLE'],
//     notice: 'Function with auth modifier singleline',
//   },
//   {
//     sig: 'withAuthNoParams(address)',
//     roles: ['NO_PARAMS_ROLE'],
//     notice: null,
//   },
// ])
