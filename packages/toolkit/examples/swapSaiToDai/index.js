/* eslint-disable @typescript-eslint/no-var-requires */
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')
const { encodeActCall, exec } = require('../../dist') // require('@aragon/toolkit')
/* eslint-enable @typescript-eslint/no-var-requires */

const [daoAddress, votingAddress, agentAddress, amount] = process.argv.slice(2)

async function main() {
  // Encode a bunch of payments.
  const newApproveSignature = 'approve(address,uint256)'
  const swapSaiToDaiSignature = 'swapSaiToDai(uint256)'
  const forwardSignature = 'forward(bytes)'

  const saiTokenAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
  const migrationContractAddress = '0xc73e0383F3Aff3215E6f04B0331D58CeCf0Ab849'
  const uint256Max = `0x${'f'.repeat(64)}` // 0xfffff...

  const script1 = encodeCallScript([
    {
      to: saiTokenAddress,
      calldata: await encodeActCall(newApproveSignature, [
        migrationContractAddress,
        uint256Max,
      ]),
    },
  ])

  const script2 = encodeCallScript([
    {
      to: migrationContractAddress,
      calldata: await encodeActCall(swapSaiToDaiSignature, [amount]),
    },
  ])

  // Encode all actions into a single EVM script.
  const script = encodeCallScript([
    {
      to: agentAddress,
      calldata: await encodeActCall(forwardSignature, [script1]),
    },
    {
      to: agentAddress,
      calldata: await encodeActCall(forwardSignature, [script2]),
    },
  ])

  const tx = await exec(
    daoAddress,
    votingAddress,
    'newVote',
    [script, 'Swap SAI to DAI'],
    () => {},
    'mainnet'
  )

  console.log(`
Done! Transaction ${tx.receipt.transactionHash} executed
Run aragon start, and go to

  https//mainnet.aragon.org/#/${daoAddress}/${votingAddress}

to verify that the vote containing multiple votes was created.
`)

  process.exit()
}

main().catch(console.error)
