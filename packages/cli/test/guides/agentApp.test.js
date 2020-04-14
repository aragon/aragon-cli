import test from 'ava'
//
import {
  runAragonCLI,
  getLocalWeb3,
  matchAddressAtLineContaining,
} from '../util'

// NOTE: These tests validate that the guide at https://hack.aragon.org/docs/guides-use-agent can be followed without errors and as expected.

// Enable verbose to debug/develop the test, but disable for production.
const verbose = false

let ACCOUNT1, ACCOUNT2
let DAO_A, AGENT_A, VOTING_A
let DAO_B, TOKEN_MANAGER_B, VOTING_B

async function createMembershipOrg(daoName) {
  const { stdout } = await runAragonCLI([
    'dao',
    'new',
    'membership-template',
    '1.0.0',
    '--fn',
    'newTokenAndInstance',
    '--fn-args',
    `${daoName} token`,
    'TKN',
    daoName,
    '["0xb4124cEB3451635DAcedd11767f004d8a28c6eE7"]',
    '["500000000000000000", "50000000000000000", "604800"]',
    '1296000',
    'true',
  ])

  return matchAddressAtLineContaining(stdout, 'Created DAO')
}

test.before(async (t) => {
  // Identify accounts
  const web3 = await getLocalWeb3()
  const accounts = await web3.eth.getAccounts()
  ACCOUNT1 = accounts[0]
  ACCOUNT2 = accounts[1]
  if (verbose) console.log(`ACCOUNT1`, ACCOUNT1)
  if (verbose) console.log(`ACCOUNT2`, ACCOUNT2)
})

test.serial('creates DAO A', async (t) => {
  const name = `DAO_A_${new Date().getTime()}`

  DAO_A = await createMembershipOrg(name)
  if (verbose) console.log(name, DAO_A)

  t.pass()
})

test.serial('creates DAO B', async (t) => {
  const name = `DAO_B_${new Date().getTime()}`

  DAO_B = await createMembershipOrg(name)
  if (verbose) console.log(name, DAO_B)

  t.pass()
})

test.serial('retrieves applications from DAO A', async (t) => {
  const { stdout } = await runAragonCLI(
    ['dao', 'apps', DAO_A, '--all'],
    verbose
  )

  AGENT_A = matchAddressAtLineContaining(stdout, 'agent')
  VOTING_A = matchAddressAtLineContaining(stdout, 'voting')

  if (verbose) console.log(`AGENT_A`, AGENT_A)

  t.pass()
})

test.serial('retrieves applications from DAO B', async (t) => {
  const { stdout } = await runAragonCLI(
    ['dao', 'apps', DAO_B, '--all'],
    verbose
  )

  TOKEN_MANAGER_B = matchAddressAtLineContaining(stdout, 'token-manager')
  VOTING_B = matchAddressAtLineContaining(stdout, 'voting')

  if (verbose) console.log(`TOKEN_MANAGER_B`, TOKEN_MANAGER_B)
  if (verbose) console.log(`VOTING_B`, VOTING_B)

  t.pass()
})

test.serial('creates a vote in DAO B to mint a token for DAO A', async (t) => {
  await runAragonCLI([
    'dao',
    'exec',
    DAO_B,
    TOKEN_MANAGER_B,
    'mint',
    AGENT_A,
    '1',
  ])

  t.pass()
})

test.serial('approves vote in DAO B', async (t) => {
  await runAragonCLI(
    ['dao', 'exec', DAO_B, VOTING_B, 'vote', 0, true, true],
    verbose
  )

  t.pass()
})

test.serial(
  'create a vote in DAO B, to add a new member account 2',
  async (t) => {
    await runAragonCLI(
      ['dao', 'exec', DAO_B, TOKEN_MANAGER_B, 'mint', ACCOUNT2, '1'],
      verbose
    )

    t.pass()
  }
)

test.serial(
  'DAO A votes in DAO B to add account 2 (via the agent)',
  async (t) => {
    await runAragonCLI(
      [
        'dao',
        'act',
        AGENT_A,
        VOTING_B,
        '"vote(uint256,bool,bool)"',
        1,
        true,
        true,
      ],
      verbose
    )

    t.pass()
  }
)

test.serial('dao A approves the vote to act on DAO B', async (t) => {
  await runAragonCLI(
    ['dao', 'exec', DAO_A, VOTING_A, 'vote', 0, true, true],
    verbose
  )

  t.pass()
})

test.serial('account 1 votes in DAO B to add account 2', async (t) => {
  await runAragonCLI(
    ['dao', 'exec', DAO_B, VOTING_B, 'vote', 1, true, true],
    verbose
  )

  t.pass()
})
