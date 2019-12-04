import test from 'ava'
import execa from 'execa'

import { runAragonCLI } from '../test-utils'

// NOTE: These tests are currently using the aragon-cli/tests/integration bootstrapping method, but they should use the e2e-tests bootstrapping method. When tests are reordered, these should live in aragon-cli/tests, and use the same bootstrapping method as its neighboring tests.

function lastWordFromStdout(stdout, lineNum) {
  // console.log(stdout)

  const lines = stdout.split('\n')
  const lineIdx = lineNum >= 0 ? lineNum : lines.length + lineNum
  const line = lines[lineIdx]

  const words = line.split(' ')
  const word = words[words.length - 1]
  return word
}

test('the guide can be followed without errors', async t => {
  let stdout

  // 1. Create a DAO
  stdout = await runAragonCLI(['dao', 'new'])
  const DAO = lastWordFromStdout(stdout, -1)

  // 2. Create a token
  stdout = await runAragonCLI(['dao', 'token', 'new', 'Member token', 'MBR', 0])
  const TOKEN = lastWordFromStdout(stdout, -4)

  // # Install token manager app
  // printf "\n>>> INSTALLING TOKEN MANAGER...\n"
  // TOKEN_MANAGER=$(aragon dao install $DAO token-manager --app-init none | lastWordAtLine 2)

  // 3. Install a Token Manager app
  stdout = await runAragonCLI(['dao', 'install', DAO, 'token-manager', '--app-init', 'none'])
  const TOKEN_MANAGER = lastWordFromStdout(stdout, -2)
  console.log(TOKEN_MANAGER)

  // # Change token controller
  // printf "\n>>> CHANGING TOKEN CONTROLLER...\n"
  // aragon dao token change-controller $TOKEN $TOKEN_MANAGER

  // # Give main account permission to mint
  // printf "\n>>> CREATING MINT_ROLE PERMISSION...\n"
  // aragon dao acl create $DAO $TOKEN_MANAGER MINT_ROLE $ACCOUNT1 $ACCOUNT1

  // # Initialize token manager
  // printf "\n>>> INITIALIZING TOKEN MANAGER...\n"
  // aragon dao exec $DAO $TOKEN_MANAGER initialize $TOKEN false 1

  // # Mint tokens for 2 accounts
  // printf "\n>>> MINTING TOKENS...\n"
  // aragon dao exec $DAO $TOKEN_MANAGER mint $ACCOUNT1 1
  // aragon dao exec $DAO $TOKEN_MANAGER mint $ACCOUNT2 1

  // # Install voting app
  // printf "\n>>> INSTALLING VOTING APP...\n"
  // VOTING=$(aragon dao install $DAO voting --app-init-args $TOKEN 600000000000000000 250000000000000000 604800 | lastWordAtLine 1)

  // # Set up voting app permissions
  // ACL=0x1fc294d2c23f9d79d07640af7e506714fd0b8ad4
  // printf "\n>>> SETTING UP VOTING PERMISSIONS...\n"
  // aragon dao acl create $DAO $VOTING CREATE_VOTES_ROLE $TOKEN_MANAGER $VOTING
  // aragon dao acl create $DAO $VOTING MODIFY_SUPPORT_ROLE $VOTING $VOTING
  // aragon dao acl grant $DAO $DAO APP_MANAGER_ROLE $VOTING
  // aragon dao acl grant $DAO $ACL CREATE_PERMISSIONS_ROLE $VOTING

  t.true(true)
})
