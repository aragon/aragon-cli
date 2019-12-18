const Web3 = require('web3')
const {
  newDao,
  getApmRepo,
  getInstalledApps,
  encodeActCall,
  exec
} = require('@aragon/toolkit')
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')

async function main() {

  // Connect web3.
  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(`ws://localhost:8545`)
  )

  // Retrieve web3 accounts.
  const accounts = await web3.eth.getAccounts()
  const acc0 = accounts[0]
  // console.log(`accounts`, accounts)

  // Construct options to be used in upcoming calls to the toolkit.
  // NOTE: These are pretty useful to see where the toolkit's interface could be improved.
  // Ideally, none of this should be necessary.
  const options = {
    web3,
    provider: web3.eth.currentProvider,
    registryAddress: '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1',
    ipfs: {
      rpc: {
        protocol: 'http',
        host: 'localhost',
        port: 5001,
        default: true,
      },
      gateway: 'http://localhost:8080/ipfs',
    }
  }
  options.ensRegistryAddress = options.registryAddress
  options['ens-registry'] = options.registryAddress
  // console.log(`options`, options)

  // Retrieve DAO template from APM.
  const repo = await getApmRepo(
    web3,
    'membership-template.aragonpm.eth',
    'latest',
    options
  )
  // console.log(`repo`, repo)

  // Create a membership DAO.
  console.log(`Creating DAO...`)
  const daoAddress = await newDao({
    repo,
    web3,
    newInstanceMethod: 'newTokenAndInstance',
    newInstanceArgs: [
      'Token name',
      'TKN',
      'daoname' + Math.floor(Math.random() * 1000000),
      [acc0],
      ['500000000000000000', '50000000000000000', '604800'],
      '1296000',
      true,
    ],
    deployEvent: 'DeployDao',
  })
  console.log(`  Created DAO:`, daoAddress)

  // Retrieve Voting app.
  console.log(`Retrieving apps...`)
  const apps = await getInstalledApps(daoAddress, options)
  const votingAddress = apps.find(app => app.name === "Voting").proxyAddress
  console.log(`  Voting app`, votingAddress)

  // Encode a bunch of votes.
  console.log(`Encoding multiple votes...`)
  const actions = []
  const emptyScript = '0x00'
  const newVoteSignature = 'newVote(bytes,string)'
  for(let i = 0; i < 10; i++) {
    actions.push({
      to: votingAddress,
      calldata: await encodeActCall(newVoteSignature, [emptyScript, `Vote metadata ${i}`])
    })
  }
  // console.log(`actions`, actions)

  // Encode all actions into a single EVM script.
  console.log(`Encoding votes into an EVM script...`)
  const script = encodeCallScript(actions)
  // console.log(`script`, script)

  // Create a single vote with all the other votes encoded in the script.
  console.log(`Creating bundled vote with EVM script...`)
  const tx = await exec({
    web3,
    dao: daoAddress,
    app: votingAddress,
    method: 'newVote',
    params: [script, "Execute multiple votes"],
    apm: options
  })
  // console.log(`tx`, tx)

  console.log(`\nDone!\n`)
  console.log(`\nRun aragon start, and go to http://localhost:3000/#/${daoAddress}/${votingAddress} to verify that the vote containing multiple votes was created.`)

  process.exit()
}

main()
