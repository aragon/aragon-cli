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

jest.setTimeout(160000)

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

let web3
beforeAll(async () => {
  // Identify accounts
  web3 = await getLocalWeb3()
  const accounts = await web3.eth.getAccounts()
  ACCOUNT1 = accounts[0]
  ACCOUNT2 = accounts[1]
  if (verbose) console.log(`ACCOUNT1`, ACCOUNT1)
  if (verbose) console.log(`ACCOUNT2`, ACCOUNT2)
})

afterAll(async () => {
  await web3.currentProvider.connection.close()
})

test('creates DAO A', async () => {
  const name = `DAO_A_${new Date().getTime()}`

  DAO_A = await createMembershipOrg(name)
  if (verbose) console.log(name, DAO_A)
})

test('creates DAO B', async () => {
  const name = `DAO_B_${new Date().getTime()}`

  DAO_B = await createMembershipOrg(name)
  if (verbose) console.log(name, DAO_B)
})

test('retrieves applications from DAO A', async () => {
  const { stdout } = await runAragonCLI(
    ['dao', 'apps', DAO_A, '--all'],
    verbose
  )

  AGENT_A = matchAddressAtLineContaining(stdout, 'agent')
  VOTING_A = matchAddressAtLineContaining(stdout, 'voting')

  if (verbose) console.log(`AGENT_A`, AGENT_A)
})

test('retrieves applications from DAO B', async () => {
  const { stdout } = await runAragonCLI(
    ['dao', 'apps', DAO_B, '--all'],
    verbose
  )

  TOKEN_MANAGER_B = matchAddressAtLineContaining(stdout, 'token-manager')
  VOTING_B = matchAddressAtLineContaining(stdout, 'voting')

  if (verbose) console.log(`TOKEN_MANAGER_B`, TOKEN_MANAGER_B)
  if (verbose) console.log(`VOTING_B`, VOTING_B)
})

test('creates a vote in DAO B to mint a token for DAO A', async () => {
  await runAragonCLI([
    'dao',
    'exec',
    DAO_B,
    TOKEN_MANAGER_B,
    'mint',
    AGENT_A,
    '1',
  ])
})

test('approves vote in DAO B', async () => {
  await runAragonCLI(
    ['dao', 'exec', DAO_B, VOTING_B, 'vote', 0, true, true],
    verbose
  )
})

test('create a vote in DAO B, to add a new member account 2', async () => {
  await runAragonCLI(
    ['dao', 'exec', DAO_B, TOKEN_MANAGER_B, 'mint', ACCOUNT2, '1'],
    verbose
  )
})

test('DAO A votes in DAO B to add account 2 (via the agent)', async () => {
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
})

test('dao A approves the vote to act on DAO B', async () => {
  await runAragonCLI(
    ['dao', 'exec', DAO_A, VOTING_A, 'vote', 0, true, true],
    verbose
  )
})

test('account 1 votes in DAO B to add account 2', async () => {
  await runAragonCLI(
    ['dao', 'exec', DAO_B, VOTING_B, 'vote', 1, true, true],
    verbose
  )
})
