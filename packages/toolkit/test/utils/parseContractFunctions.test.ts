import test from 'ava'
import fs from 'fs'
import path from 'path'
//
import parseContractFunctions, {
  parseGlobalVariableAssignments,
  hasConstructor,
} from '../../src/utils/parseContractFunctions'

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

test('should find global variable assignments defined in contract', t => {
  const sourceCode = `
    pragma solidity 0.4.24;
    
    contract Test {
      string testInitString = 'test';
      string testString;
      int private constant testPrivateConstInt = 1;
      int private testPrivateInt;
    }
  `

  const variables = parseGlobalVariableAssignments(sourceCode)
  t.is(variables.length, 1)
})

test('should find constructor', t => {
  const sourceCode = `
    pragma solidity 0.4.24;

    contract Test {
      string testString;

      constructor() {
        testString = 'test';
      }
    }
  `

  const found = hasConstructor(sourceCode)
  t.is(found, true)
})
