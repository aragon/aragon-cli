import test from 'ava'
import Web3 from 'web3'
import { encodeCallScript } from '@aragon/test-helpers/evmScript'
import {
  newDao,
  getApmRepo,
  getInstalledApps,
  encodeActCall,
  exec,
  useEnvironment,
} from '../dist/index'

test.serial(
  'Create a single vote with multiple votes encoded in an EVM script',
  async t => {
    const { web3 } = useEnvironment()

    // Retrieve web3 accounts.
    const accounts = await web3.eth.getAccounts()
    const acc0 = accounts[0]

    // Create a membership DAO.
    console.log(`Creating DAO...`)
    const daoAddress = await newDao(
      'membership-template',
      [
        'Token name',
        'TKN',
        'daoname' + Math.floor(Math.random() * 1000000),
        [acc0],
        ['500000000000000000', '50000000000000000', '604800'],
        '1296000',
        true,
      ],
      'newTokenAndInstance'
    )
    console.log(`Created DAO: ${daoAddress}`)

    // Retrieve Voting app.
    console.log(`Retrieving apps...`)
    const apps = await getInstalledApps(daoAddress)
    const votingApp = apps.find(app => app.name === 'Voting')
    if (!votingApp)
      throw Error(
        `Voting app not found: ${apps.map(({ name }) => name).join(', ')}`
      )
    const votingAddress = votingApp.proxyAddress
    console.log(`Retrieved voting app: ${votingAddress}`)

    // Encode a bunch of votes.
    console.log(`Encoding multiple votes...`)
    const actions = []
    const emptyScript = '0x00'
    const newVoteSignature = 'newVote(bytes,string)'
    for (let i = 0; i < 10; i++) {
      actions.push({
        to: votingAddress,
        calldata: await encodeActCall(newVoteSignature, [
          emptyScript,
          `Vote metadata ${i}`,
        ]),
      })
    }

    // Encode all actions into a single EVM script.
    console.log(`Encoding votes into an EVM script...`)
    const script = encodeCallScript(actions)

    // Create a single vote with all the other votes encoded in the script.
    console.log(`Creating bundled vote with EVM script...`)
    const tx = await exec(daoAddress, votingAddress, 'newVote', [
      script,
      'Execute multiple votes',
    ])

    console.log(`
Done! Transaction ${tx.receipt.transactionHash} executed
Run aragon start, and go to 
  
  http://localhost:3000/#/${daoAddress}/${votingAddress} 
  
to verify that the vote containing multiple votes was created.
`)

    t.pass()
  }
)
