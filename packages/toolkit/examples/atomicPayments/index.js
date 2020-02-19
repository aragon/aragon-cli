/* eslint-disable @typescript-eslint/no-var-requires */
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')
const { encodeActCall, exec } = require('../../dist') // require('@aragon/toolkit')

const {
  daoAddress,
  votingAddress,
  financeAddress,
  payments,
  environment,
} = require('./payments.json')
/* eslint-enable @typescript-eslint/no-var-requires */

async function main() {
  // Encode a bunch of payments.
  const newImmediatePaymentSignature =
    'newImmediatePayment(address,address,uint256,string)'
  const calldatum = await Promise.all(
    payments.map(({ tokenAddress, receiverAddress, amount, receipt }) =>
      encodeActCall(newImmediatePaymentSignature, [
        tokenAddress,
        receiverAddress,
        amount,
        receipt,
      ])
    )
  )

  const actions = calldatum.map(calldata => ({
    to: financeAddress,
    calldata,
  }))

  // Encode all actions into a single EVM script.
  const script = encodeCallScript(actions)

  const tx = await exec(
    daoAddress,
    votingAddress,
    'newVote',
    [script, 'Payments'],
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
