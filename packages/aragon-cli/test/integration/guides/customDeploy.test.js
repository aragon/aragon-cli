import test from 'ava'
import execa from 'execa'

import { getLocalWeb3, matchAddressAtLineContaining } from '../test-utils'

// import { runAragonCLI } from '../test-utils'
async function runAragonCLI(args) {
  console.log(`\n>>> ${args.join(' ')}`)
  const subprocess = execa('node', ['dist/cli.js', ...args])
  subprocess.stdout.pipe(process.stdout)
  return (await subprocess).stdout
}

// NOTE: These tests are currently using the aragon-cli/tests/integration bootstrapping method, but they should use the e2e-tests bootstrapping method. When tests are reordered, these should live in aragon-cli/tests, and use the same bootstrapping method as its neighboring tests.

test('the guide can be followed without errors', async t => {
  let stdout

  // Retrieve web3 instance
  const web3 = await getLocalWeb3()

  // Identify accounts
  const accounts = await web3.eth.getAccounts()
  const ACCOUNT1 = accounts[0]
  const ACCOUNT2 = accounts[1]

  // Create a DAO
  stdout = await runAragonCLI(['dao', 'new'])
  const DAO = matchAddressAtLineContaining(stdout, 'Created DAO')
  console.log(`DAO`, DAO)

  // Create a token
  stdout = await runAragonCLI(['dao', 'token', 'new', 'Member token', 'MBR', 0])
  const TOKEN = matchAddressAtLineContaining(stdout, 'Successfully deployed the token')
  console.log(`TOKEN`, TOKEN)

  // Install a token manager app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'token-manager', '--app-init', 'none'])
  const TOKEN_MANAGER = matchAddressAtLineContaining(stdout, 'Installed token-manager')
  console.log(`TOKEN_MANAGER`, TOKEN_MANAGER)

  // Retrieve apps list
  stdout = await runAragonCLI(['dao', 'apps', DAO, '--all'])
  const ACL = matchAddressAtLineContaining(stdout, 'acl')
  console.log(`ACL`, ACL)

  // Change the token's controller
  await runAragonCLI(['dao', 'token', 'change-controller', TOKEN, TOKEN_MANAGER])

  // Give main account permission to mint
  await runAragonCLI(['dao', 'acl', 'create', DAO, TOKEN_MANAGER, 'MINT_ROLE', ACCOUNT1, ACCOUNT1])

  // Initialize token manager
  await runAragonCLI(['dao', 'exec', DAO, TOKEN_MANAGER, 'initialize', TOKEN, 'false', '1'])

  // # Mint tokens for 2 accounts
  await runAragonCLI(['dao', 'exec', DAO, TOKEN_MANAGER, 'mint', ACCOUNT1, 1])
  await runAragonCLI(['dao', 'exec', DAO, TOKEN_MANAGER, 'mint', ACCOUNT2, 1])

  // Install voting app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'voting', '--app-init-args', TOKEN, '600000000000000000', '250000000000000000', '604800'])
  const VOTING = matchAddressAtLineContaining(stdout, 'Installed voting')
  console.log(`VOTING`, VOTING)

  // Set up voting app permissions
  await runAragonCLI(['dao', 'acl', 'create', DAO, VOTING, 'CREATE_VOTES_ROLE', TOKEN_MANAGER, VOTING])
  await runAragonCLI(['dao', 'acl', 'create', DAO, VOTING, 'MODIFY_SUPPORT_ROLE', VOTING, VOTING])
  await runAragonCLI(['dao', 'acl', 'grant', DAO, DAO, 'APP_MANAGER_ROLE', VOTING])
  await runAragonCLI(['dao', 'acl', 'grant', DAO, ACL, 'CREATE_PERMISSIONS_ROLE', VOTING])

  // Install vault app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'vault'])
  const VAULT = matchAddressAtLineContaining(stdout, 'Installed vault')
  console.log(`VAULT`, VAULT)

  // Install finance app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'finance', '--app-init-args', VAULT, '2592000'])
  const FINANCE = matchAddressAtLineContaining(stdout, 'Installed finance')
  console.log(`FINANCE`, FINANCE)

  // Set up vault permissions
  await runAragonCLI(['dao', 'acl', 'create', DAO, VAULT, 'TRANSFER_ROLE', FINANCE, VOTING])

  // Set up finance permissions
  await runAragonCLI(['dao', 'acl', 'create', DAO, FINANCE, 'CREATE_PAYMENTS_ROLE', VOTING, VOTING])
  await runAragonCLI(['dao', 'acl', 'create', DAO, FINANCE, 'EXECUTE_PAYMENTS_ROLE', VOTING, VOTING])
  await runAragonCLI(['dao', 'acl', 'create', DAO, FINANCE, 'MANAGE_PAYMENTS_ROLE', VOTING, VOTING])

  // Review acl permissions
  // dao acl <dao-address>
  await runAragonCLI(['dao', 'acl', DAO])

  // Clean up permissions
  // dao acl grant <dao-address> <app-address> <ROLE> <entity-address>
  // dao acl revoke <dao-address> <app-address> <ROLE> [your-address]
  // dao acl set-manager <dao-address> <app-address> <ROLE> <entity-address>

  t.pass()
})
