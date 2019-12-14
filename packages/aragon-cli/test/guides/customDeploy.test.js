import test from 'ava'

import {
  runAragonCLI,
  getLocalWeb3,
  matchAddressAtLineContaining,
} from '../util'

// NOTE: These tests validate that the guide at https://hack.aragon.org/docs/guides-custom-deploy can be followed without errors and as expected.

// TODO: These tests simply assure that there is no error thrown when running commands from the guide. Additionally, some assertions could be made on each test.

// Enable verbose to debug/develop the test, but disable for production.
const verbose = false

let ACCOUNT1, ACCOUNT2, DAO, ACL, TOKEN, TOKEN_MANAGER, VAULT, FINANCE, VOTING

test.before(async t => {
  // Identify accounts
  const web3 = await getLocalWeb3()
  const accounts = await web3.eth.getAccounts()
  ACCOUNT1 = accounts[0]
  ACCOUNT2 = accounts[1]
  if (verbose) console.log(`ACCOUNT1`, ACCOUNT1)
  if (verbose) console.log(`ACCOUNT2`, ACCOUNT2)
})

test.serial('creates a dao', async t => {
  const { stdout } = await runAragonCLI(['dao', 'new'], verbose)
  DAO = matchAddressAtLineContaining(stdout, 'Created DAO')
  if (verbose) console.log(`DAO`, DAO)

  t.pass()
})

test.serial('creates a token', async t => {
  const { stdout } = await runAragonCLI(
    ['dao', 'token', 'new', 'Member token', 'MBR', 0],
    verbose
  )
  TOKEN = matchAddressAtLineContaining(
    stdout,
    'Successfully deployed the token'
  )
  if (verbose) console.log(`TOKEN`, TOKEN)

  t.pass()
})

test.serial('installs a token manager app', async t => {
  const { stdout } = await runAragonCLI(
    ['dao', 'install', DAO, 'token-manager', '--app-init', 'none'],
    verbose
  )
  TOKEN_MANAGER = matchAddressAtLineContaining(
    stdout,
    'Installed token-manager'
  )
  if (verbose) console.log(`TOKEN_MANAGER`, TOKEN_MANAGER)

  t.pass()
})

test.serial('retrieves a list of apps', async t => {
  const { stdout } = await runAragonCLI(['dao', 'apps', DAO, '--all'], verbose)
  ACL = matchAddressAtLineContaining(stdout, 'acl')
  if (verbose) console.log(`ACL`, ACL)

  t.pass()
})

test.serial('changes the token controller', async t => {
  await runAragonCLI(
    ['dao', 'token', 'change-controller', TOKEN, TOKEN_MANAGER],
    verbose
  )

  t.pass()
})

test.serial('gives the main account permission to mint', async t => {
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

  t.pass()
})

test.serial('initializes the token manager', async t => {
  await runAragonCLI(
    ['dao', 'exec', DAO, TOKEN_MANAGER, 'initialize', TOKEN, 'false', '1'],
    verbose
  )

  t.pass()
})

test.serial('mints tokens', async t => {
  await runAragonCLI(
    ['dao', 'exec', DAO, TOKEN_MANAGER, 'mint', ACCOUNT1, 1],
    verbose
  )
  await runAragonCLI(
    ['dao', 'exec', DAO, TOKEN_MANAGER, 'mint', ACCOUNT2, 1],
    verbose
  )

  t.pass()
})

test.serial('installs the voting app', async t => {
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

  t.pass()
})

test.serial('sets the voting app permissions', async t => {
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

  t.pass()
})

test.serial('installs the vault app', async t => {
  const { stdout } = await runAragonCLI(
    ['dao', 'install', DAO, 'vault'],
    verbose
  )
  VAULT = matchAddressAtLineContaining(stdout, 'Installed vault')
  if (verbose) console.log(`VAULT`, VAULT)

  t.pass()
})

test.serial('installs the finance app', async t => {
  const { stdout } = await runAragonCLI(
    ['dao', 'install', DAO, 'finance', '--app-init-args', VAULT, '2592000'],
    verbose
  )
  FINANCE = matchAddressAtLineContaining(stdout, 'Installed finance')
  if (verbose) console.log(`FINANCE`, FINANCE)

  t.pass()
})

test.serial('sets vault app permissions', async t => {
  await runAragonCLI(
    ['dao', 'acl', 'create', DAO, VAULT, 'TRANSFER_ROLE', FINANCE, VOTING],
    verbose
  )

  t.pass()
})

test.serial('sets finance app permissions', async t => {
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

  t.pass()
})

test.serial('prints acl permissions', async t => {
  await runAragonCLI(['dao', 'acl', DAO], verbose)

  t.pass()
})

test.serial('cleans permissions', async t => {
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

  t.pass()
})
