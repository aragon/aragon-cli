import test from 'ava'

import {
  runAragonCLI,
  getLocalWeb3,
  matchAddressAtLineContaining
} from '../test-utils'

// TODO: Split this into multiple tests with contexts once we migrate to mocha.

test.skip('https://hack.aragon.org/docs/guides-use-agent guide can be followed without errors', async t => {
  // Enable verbose to debug/develop the test, but disable for production.
  const verbose = true

  let stdout

  // Retrieve web3 instance
  const web3 = await getLocalWeb3()

  // Identify accounts
  const accounts = await web3.eth.getAccounts()
  const ACCOUNT1 = accounts[0]
  const ACCOUNT2 = accounts[1]
  if (verbose) console.log(`ACCOUNT1`, ACCOUNT1)
  if (verbose) console.log(`ACCOUNT2`, ACCOUNT2)

  // Create a "democracy" DAO
  // TODO: This is throwing a generic revert for some reason.
  stdout = await runAragonCLI([
    'dao',
    'new',
    'membership-template',
    '--fn',
    'newTokenAndInstance',
    '--fn-args',
    'Member token', // token name
    'MBR', // token symbol
    'JustAnotherOrg', // org id
    `[\"${ACCOUNT1}\", \"${ACCOUNT2}\"]`, // members
    `[\"600000000000000000\", \"250000000000000000\", \"604800\"]`, // voting settings (support, quorum, duration)
    0, // finance period
    true // use agent instead of vault
  ], verbose)
  const DAO = matchAddressAtLineContaining(stdout, 'Created DAO')
  if (verbose) console.log(`DAO`, DAO)

  // TODO: Continue implementing guide...

  t.pass()
})
