/* eslint-disable @typescript-eslint/no-var-requires */
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')
const { encodeActCall, exec } = require('../../dist') // require('@aragon/toolkit')

const {
  daoAddress,
  tokenManagerAddress,
  votingAddress,
  mints,
  burns,
  environment,
} = require('./assignations.json')
/* eslint-enable @typescript-eslint/no-var-requires */

async function main() {
  // Encode a bunch of token mints and burns.
  const mintSignature = 'mint(address,uint256)'
  const burnSignature = 'burn(address,uint256)'
  const calldatum = await Promise.all([
    ...mints.map(([receiverAddress, amount]) =>
      encodeActCall(mintSignature, [receiverAddress, amount])
    ),
    ...burns.map(([holderAddress, amount]) =>
      encodeActCall(burnSignature, [holderAddress, amount])
    ),
  ])

  const actions = calldatum.map(calldata => ({
    to: tokenManagerAddress,
    calldata,
  }))

  // Encode all actions into a single EVM script.
  const script = encodeCallScript(actions)
  const tx = await exec(
    daoAddress,
    votingAddress,
    'newVote',
    [script, 'Mints and Burns'],
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
