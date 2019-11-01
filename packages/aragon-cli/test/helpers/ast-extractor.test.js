import test from 'ava'
import path from 'path'
import { extractRoles } from '../../src/helpers/ast-extractor'

test('Ast extractor > Parse Finance app', t => {
  t.plan(1)

  const financeRoles = extractRoles(
    path.resolve(__dirname, '../sample-apps/finance/Finance.json')
  )

  t.deepEqual(financeRoles, [
    {
      id: 'CREATE_PAYMENTS_ROLE',
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
      id: 'CREATE_PAYMENTS_ROLE',
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
      id: 'CHANGE_PERIOD_ROLE',
      params: ['_periodDuration', 'periodDuration'],
      functionName: 'setPeriodDuration',
    },
    {
      id: 'CHANGE_BUDGETS_ROLE',
      params: ['_token', '_amount', 'budgets', 'flag'],
      functionName: 'setBudget',
    },
    {
      id: 'CHANGE_BUDGETS_ROLE',
      params: ['_token', '0', 'budgets', 'flag'],
      functionName: 'removeBudget',
    },
    {
      id: 'EXECUTE_PAYMENTS_ROLE',
      params: ['_paymentId', 'amount'],
      functionName: 'executePayment',
    },
    {
      id: 'MANAGE_PAYMENTS_ROLE',
      params: ['_paymentId', 'flag'],
      functionName: 'setPaymentStatus',
    },
  ])
})

test('Ast extractor > Parse Voting app', t => {
  t.plan(1)

  const votingRoles = extractRoles(
    path.resolve(__dirname, '../sample-apps/voting/Voting.json')
  )
  t.deepEqual(votingRoles, [
    {
      id: 'MODIFY_SUPPORT_ROLE',
      params: ['_supportRequiredPct', 'supportRequiredPct'],
      functionName: 'changeSupportRequiredPct',
    },
    {
      id: 'MODIFY_QUORUM_ROLE',
      params: ['_minAcceptQuorumPct', 'minAcceptQuorumPct'],
      functionName: 'changeMinAcceptQuorumPct',
    },
    { id: 'CREATE_VOTES_ROLE', params: [], functionName: 'newVote' },
    { id: 'CREATE_VOTES_ROLE', params: [], functionName: 'newVote' },
  ])
})
