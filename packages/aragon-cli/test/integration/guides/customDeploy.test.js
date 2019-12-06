import test from 'ava'

import {
  runAragonCLI,
  getLocalWeb3,
  matchAddressAtLineContaining
} from '../test-utils'

// TODO: Split this into multiple tests with contexts once we migrate to mocha.

test('https://hack.aragon.org/docs/guides-custom-deploy guide can be followed without errors', async t => {
  // Enable verbose to debug/develop the test, but disable for production.
  const verbose = false

  let stdout

  // Retrieve web3 instance
  const web3 = await getLocalWeb3()

  // Identify accounts
  const accounts = await web3.eth.getAccounts()
  const ACCOUNT1 = accounts[0]
  const ACCOUNT2 = accounts[1]
  if (verbose) console.log(`ACCOUNT1`, ACCOUNT1)
  if (verbose) console.log(`ACCOUNT2`, ACCOUNT2)

  // Create a DAO
  stdout = await runAragonCLI(['dao', 'new'], verbose)
  const DAO = matchAddressAtLineContaining(stdout, 'Created DAO')
  if (verbose) console.log(`DAO`, DAO)

  // Create a token
  stdout = await runAragonCLI(['dao', 'token', 'new', 'Member token', 'MBR', 0], verbose)
  const TOKEN = matchAddressAtLineContaining(stdout, 'Successfully deployed the token')
  if (verbose) console.log(`TOKEN`, TOKEN)

  // Install a token manager app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'token-manager', '--app-init', 'none'], verbose)
  const TOKEN_MANAGER = matchAddressAtLineContaining(stdout, 'Installed token-manager')
  if (verbose) console.log(`TOKEN_MANAGER`, TOKEN_MANAGER)

  // Retrieve apps list
  stdout = await runAragonCLI(['dao', 'apps', DAO, '--all'], verbose)
  const ACL = matchAddressAtLineContaining(stdout, 'acl')
  if (verbose) console.log(`ACL`, ACL)

  // Change the token's controller
  await runAragonCLI(['dao', 'token', 'change-controller', TOKEN, TOKEN_MANAGER], verbose)

  // Give main account permission to mint
  await runAragonCLI(['dao', 'acl', 'create', DAO, TOKEN_MANAGER, 'MINT_ROLE', ACCOUNT1, ACCOUNT1], verbose)

  // Initialize token manager
  await runAragonCLI(['dao', 'exec', DAO, TOKEN_MANAGER, 'initialize', TOKEN, 'false', '1'], verbose)

  // # Mint tokens for 2 accounts
  await runAragonCLI(['dao', 'exec', DAO, TOKEN_MANAGER, 'mint', ACCOUNT1, 1], verbose)
  await runAragonCLI(['dao', 'exec', DAO, TOKEN_MANAGER, 'mint', ACCOUNT2, 1], verbose)

  // Install voting app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'voting', '--app-init-args', TOKEN, '600000000000000000', '250000000000000000', '604800'], verbose)
  const VOTING = matchAddressAtLineContaining(stdout, 'Installed voting')
  if (verbose) console.log(`VOTING`, VOTING)

  // Set up voting app permissions
  await runAragonCLI(['dao', 'acl', 'create', DAO, VOTING, 'CREATE_VOTES_ROLE', TOKEN_MANAGER, VOTING], verbose)
  await runAragonCLI(['dao', 'acl', 'create', DAO, VOTING, 'MODIFY_SUPPORT_ROLE', VOTING, VOTING], verbose)
  await runAragonCLI(['dao', 'acl', 'grant', DAO, DAO, 'APP_MANAGER_ROLE', VOTING], verbose)
  await runAragonCLI(['dao', 'acl', 'grant', DAO, ACL, 'CREATE_PERMISSIONS_ROLE', VOTING], verbose)

  // Install vault app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'vault'], verbose)
  const VAULT = matchAddressAtLineContaining(stdout, 'Installed vault')
  if (verbose) console.log(`VAULT`, VAULT)

  // Install finance app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'finance', '--app-init-args', VAULT, '2592000'], verbose)
  const FINANCE = matchAddressAtLineContaining(stdout, 'Installed finance')
  if (verbose) console.log(`FINANCE`, FINANCE)

  // Set up vault permissions
  await runAragonCLI(['dao', 'acl', 'create', DAO, VAULT, 'TRANSFER_ROLE', FINANCE, VOTING], verbose)

  // Set up finance permissions
  await runAragonCLI(['dao', 'acl', 'create', DAO, FINANCE, 'CREATE_PAYMENTS_ROLE', VOTING, VOTING], verbose)
  await runAragonCLI(['dao', 'acl', 'create', DAO, FINANCE, 'EXECUTE_PAYMENTS_ROLE', VOTING, VOTING], verbose)
  await runAragonCLI(['dao', 'acl', 'create', DAO, FINANCE, 'MANAGE_PAYMENTS_ROLE', VOTING, VOTING], verbose)

  // Review acl permissions
  await runAragonCLI(['dao', 'acl', DAO], verbose)

  // Clean up permissions
  await runAragonCLI(['dao', 'acl', 'set-manager', DAO, ACL, 'CREATE_PERMISSIONS_ROLE', VOTING], verbose)
  await runAragonCLI(['dao', 'acl', 'revoke', DAO, ACL, 'CREATE_PERMISSIONS_ROLE', ACCOUNT1], verbose)
  await runAragonCLI(['dao', 'acl', 'set-manager', DAO, DAO, 'APP_MANAGER_ROLE', VOTING], verbose)
  await runAragonCLI(['dao', 'acl', 'revoke', DAO, DAO, 'APP_MANAGER_ROLE', ACCOUNT1], verbose)
  await runAragonCLI(['dao', 'acl', 'set-manager', DAO, TOKEN_MANAGER, 'MINT_ROLE', VOTING], verbose)
  await runAragonCLI(['dao', 'acl', 'revoke', DAO, TOKEN_MANAGER, 'MINT_ROLE', ACCOUNT1], verbose)

  t.pass()
})
