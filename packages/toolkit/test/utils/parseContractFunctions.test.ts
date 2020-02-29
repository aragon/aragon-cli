import test from 'ava'
import fs from 'fs'
import path from 'path'
//
import parseContractFunctions from '../../src/utils/parseContractFunctions'

/* Tests */
test('Parse AST of Finance.sol', t => {
  const targetContract = 'Finance.sol'
  const sourceCode = fs.readFileSync(
    path.join(__dirname, 'sampleContracts', targetContract),
    'utf8'
  )
  const functions = parseContractFunctions(sourceCode, targetContract)

  // console.log(JSON.stringify(functions, null, 2))

  t.deepEqual(functions, [
    {
      name: '',
      notice: '',
      paramTypes: [],
      roles: [],
    },
    {
      name: 'deposit',
      notice: '',
      paramTypes: ['address', 'uint256', 'string'],
      roles: [],
    },
    {
      name: 'newImmediatePayment',
      notice: '',
      paramTypes: ['address', 'address', 'uint256', 'string'],
      roles: [{ id: 'CREATE_PAYMENTS_ROLE', paramCount: 6 }],
    },
    {
      name: 'newScheduledPayment',
      notice: '',
      paramTypes: [
        'address',
        'address',
        'uint256',
        'uint64',
        'uint64',
        'uint64',
        'string',
      ],
      roles: [{ id: 'CREATE_PAYMENTS_ROLE', paramCount: 6 }],
    },
    {
      name: 'setPeriodDuration',
      notice: '',
      paramTypes: ['uint64'],
      roles: [{ id: 'CHANGE_PERIOD_ROLE', paramCount: 2 }],
    },
    {
      name: 'setBudget',
      notice: '',
      paramTypes: ['address', 'uint256'],
      roles: [{ id: 'CHANGE_BUDGETS_ROLE', paramCount: 4 }],
    },
    {
      name: 'removeBudget',
      notice: '',
      paramTypes: ['address'],
      roles: [{ id: 'CHANGE_BUDGETS_ROLE', paramCount: 4 }],
    },
    {
      name: 'executePayment',
      notice: '',
      paramTypes: ['uint256'],
      roles: [{ id: 'EXECUTE_PAYMENTS_ROLE', paramCount: 2 }],
    },
    {
      name: 'receiverExecutePayment',
      notice: '',
      paramTypes: ['uint256'],
      roles: [],
    },
    {
      name: 'setPaymentStatus',
      notice: '',
      paramTypes: ['uint256', 'bool'],
      roles: [{ id: 'MANAGE_PAYMENTS_ROLE', paramCount: 2 }],
    },
    {
      name: 'recoverToVault',
      notice: '',
      paramTypes: ['address'],
      roles: [],
    },
    {
      name: 'tryTransitionAccountingPeriod',
      notice: '',
      paramTypes: ['uint64'],
      roles: [],
    },
    {
      name: 'transferToVault',
      notice: '',
      paramTypes: ['address'],
      roles: [],
    },
  ])
})
