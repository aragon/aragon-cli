import {
  runAragonCLI,
  getLocalWeb3,
  matchAddressAtLineContaining,
} from '../util'

// NOTE: These tests validate that the guide at https://hack.aragon.org/docs/guides-custom-deploy can be followed without errors and as expected.

// Enable verbose to debug/develop the test, but disable for production.
const verbose = false

let ACCOUNT1, ACCOUNT2, DAO, ACL, TOKEN, TOKEN_MANAGER, VAULT, FINANCE, VOTING

jest.setTimeout(160000)

beforeAll(async () => {
  // Identify accounts
  const web3 = await getLocalWeb3()
  const accounts = await web3.eth.getAccounts()
  ACCOUNT1 = accounts[0]
  ACCOUNT2 = accounts[1]
  if (verbose) console.log(`ACCOUNT1`, ACCOUNT1)
  if (verbose) console.log(`ACCOUNT2`, ACCOUNT2)
})

test('creates a dao', async () => {
  const { stdout } = await runAragonCLI(['dao', 'new'], verbose)
  DAO = matchAddressAtLineContaining(stdout, 'Created DAO')
  if (verbose) console.log(`DAO`, DAO)
})

test('creates a token', async () => {
  const { stdout } = await runAragonCLI(
    ['dao', 'token', 'new', 'Member token', 'MBR', 0],
    verbose
  )
  TOKEN = matchAddressAtLineContaining(
    stdout,
    'Successfully deployed the token'
  )
  if (verbose) console.log(`TOKEN`, TOKEN)
})

test('installs a token manager app', async () => {
  const { stdout } = await runAragonCLI(
    ['dao', 'install', DAO, 'token-manager', '--app-init', 'none'],
    verbose
  )
  TOKEN_MANAGER = matchAddressAtLineContaining(
    stdout,
    'Installed token-manager'
  )
  if (verbose) console.log(`TOKEN_MANAGER`, TOKEN_MANAGER)
})

test('retrieves a list of apps', async () => {
  const { stdout } = await runAragonCLI(['dao', 'apps', DAO, '--all'], verbose)
  ACL = matchAddressAtLineContaining(stdout, 'acl')
  if (verbose) console.log(`ACL`, ACL)
})

test('changes the token controller', async () => {
  await runAragonCLI(
    ['dao', 'token', 'change-controller', TOKEN, TOKEN_MANAGER],
    verbose
  )
})

test('gives the main account permission to mint', async () => {
  await runAragonCLI(
    [
      'dao',
      'acl',
      'create',
      DAO,
      TOKEN_MANAGER,
      'MINT_ROLE',
      ACCOUNT1,
      ACCOUNT1,
    ],
    verbose
  )
})

test('initializes the token manager', async () => {
  await runAragonCLI(
    ['dao', 'exec', DAO, TOKEN_MANAGER, 'initialize', TOKEN, 'false', '1'],
    verbose
  )
})

test('mints tokens', async () => {
  await runAragonCLI(
    ['dao', 'exec', DAO, TOKEN_MANAGER, 'mint', ACCOUNT1, 1],
    verbose
  )
  await runAragonCLI(
    ['dao', 'exec', DAO, TOKEN_MANAGER, 'mint', ACCOUNT2, 1],
    verbose
  )
})

test('installs the voting app', async () => {
  const { stdout } = await runAragonCLI(
    [
      'dao',
      'install',
      DAO,
      'voting',
      '--app-init-args',
      TOKEN,
      '600000000000000000',
      '250000000000000000',
      '604800',
    ],
    verbose
  )
  VOTING = matchAddressAtLineContaining(stdout, 'Installed voting')
  if (verbose) console.log(`VOTING`, VOTING)
})

test('sets the voting app permissions', async () => {
  await runAragonCLI(
    [
      'dao',
      'acl',
      'create',
      DAO,
      VOTING,
      'CREATE_VOTES_ROLE',
      TOKEN_MANAGER,
      VOTING,
    ],
    verbose
  )
  await runAragonCLI(
    [
      'dao',
      'acl',
      'create',
      DAO,
      VOTING,
      'MODIFY_SUPPORT_ROLE',
      VOTING,
      VOTING,
    ],
    verbose
  )
  await runAragonCLI(
    ['dao', 'acl', 'grant', DAO, DAO, 'APP_MANAGER_ROLE', VOTING],
    verbose
  )
  await runAragonCLI(
    ['dao', 'acl', 'grant', DAO, ACL, 'CREATE_PERMISSIONS_ROLE', VOTING],
    verbose
  )
})

test('installs the vault app', async () => {
  const { stdout } = await runAragonCLI(
    ['dao', 'install', DAO, 'vault'],
    verbose
  )
  VAULT = matchAddressAtLineContaining(stdout, 'Installed vault')
  if (verbose) console.log(`VAULT`, VAULT)
})

test('installs the finance app', async () => {
  const { stdout } = await runAragonCLI(
    ['dao', 'install', DAO, 'finance', '--app-init-args', VAULT, '2592000'],
    verbose
  )
  FINANCE = matchAddressAtLineContaining(stdout, 'Installed finance')
  if (verbose) console.log(`FINANCE`, FINANCE)
})

test('sets vault app permissions', async () => {
  await runAragonCLI(
    ['dao', 'acl', 'create', DAO, VAULT, 'TRANSFER_ROLE', FINANCE, VOTING],
    verbose
  )
})

test('sets finance app permissions', async () => {
  await runAragonCLI(
    [
      'dao',
      'acl',
      'create',
      DAO,
      FINANCE,
      'CREATE_PAYMENTS_ROLE',
      VOTING,
      VOTING,
    ],
    verbose
  )
  await runAragonCLI(
    [
      'dao',
      'acl',
      'create',
      DAO,
      FINANCE,
      'EXECUTE_PAYMENTS_ROLE',
      VOTING,
      VOTING,
    ],
    verbose
  )
  await runAragonCLI(
    [
      'dao',
      'acl',
      'create',
      DAO,
      FINANCE,
      'MANAGE_PAYMENTS_ROLE',
      VOTING,
      VOTING,
    ],
    verbose
  )
})

test('prints acl permissions', async () => {
  await runAragonCLI(['dao', 'acl', DAO], verbose)
})

test('cleans permissions', async () => {
  await runAragonCLI(
    ['dao', 'acl', 'set-manager', DAO, ACL, 'CREATE_PERMISSIONS_ROLE', VOTING],
    verbose
  )
  await runAragonCLI(
    ['dao', 'acl', 'revoke', DAO, ACL, 'CREATE_PERMISSIONS_ROLE', ACCOUNT1],
    verbose
  )
  await runAragonCLI(
    ['dao', 'acl', 'set-manager', DAO, DAO, 'APP_MANAGER_ROLE', VOTING],
    verbose
  )
  await runAragonCLI(
    ['dao', 'acl', 'revoke', DAO, DAO, 'APP_MANAGER_ROLE', ACCOUNT1],
    verbose
  )
  await runAragonCLI(
    ['dao', 'acl', 'set-manager', DAO, TOKEN_MANAGER, 'MINT_ROLE', VOTING],
    verbose
  )
  await runAragonCLI(
    ['dao', 'acl', 'revoke', DAO, TOKEN_MANAGER, 'MINT_ROLE', ACCOUNT1],
    verbose
  )
})
