/* eslint-disable @typescript-eslint/no-var-requires */
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')
const { encodeActCall, exec } = require('../../dist') // require('@aragon/toolkit')
const { keccak256 } = require('web3-utils')

const {
  daoAddress,
  aclAddress,
  votingAddress,
  create,
  grant,
  revoke,
  environment,
} = require('./permissions.json')
/* eslint-enable @typescript-eslint/no-var-requires */

async function main() {
  // Encode a bunch of acl changes.
  const createSignature = 'createPermission(address,address,bytes32,address)'
  const grantSignature = 'grantPermission(address,address,bytes32)'
  const revokeSignature = 'revokePermission(address,address,bytes32)'
  const calldatum = await Promise.all([
    ...create.map(([entity, app, role, manager]) =>
      encodeActCall(createSignature, [entity, app, keccak256(role), manager])
    ),
    ...grant.map(([entity, app, role]) =>
      encodeActCall(grantSignature, [entity, app, keccak256(role)])
    ),
    ...revoke.map(([entity, app, role]) =>
      encodeActCall(revokeSignature, [entity, app, keccak256(role)])
    ),
  ])

  const actions = calldatum.map(calldata => ({
    to: aclAddress,
    calldata,
  }))

  // Encode all actions into a single EVM script.
  const script = encodeCallScript(actions)

  const tx = await exec(
    daoAddress,
    votingAddress,
    'newVote',
    [script, 'Change permissions'],
    () => {},
    environment
  )
  const url =
    environment === 'mainnet'
      ? 'https://mainnet.aragon.org/'
      : environment === 'rinkeby'
      ? 'http://rinkeby.aragon.org/'
      : 'http:localhost:3000/'

  console.log(`
Done! Transaction ${tx.receipt.transactionHash} executed
Run aragon start, and go to

  ${url}#/${daoAddress}/${votingAddress}

to verify that the vote containing multiple votes was created.
`)

  process.exit()
}

main().catch(console.error)
