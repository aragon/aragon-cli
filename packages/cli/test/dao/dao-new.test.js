import test from 'ava'
//
import { runAragonCLI } from '../util'
import Web3 from 'web3'
import { task } from '../../src/commands/dao_cmds/new'

const daoAddressRegex = /Created DAO: (.*)$/
const daoIdAndAddressAddressRegex = /Created DAO: (.*) at (.*)$/

test('creates a new DAO', async t => {
  const { stdout } = await runAragonCLI(['dao', 'new'])
  const daoAddress = stdout.match(daoAddressRegex)[1]

  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
})

test('start IPFS', async t => {
  const { stdout } = await runAragonCLI(['dao', 'new'])
  t.assert(stdout.includes('Start IPFS'))
})

test('task creates a new DAO', async t => {
  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(`ws://localhost:8545`)
  )

  const tasks = await task({
    web3,
    apmOptions: {
      ensRegistryAddress: '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1',
      ipfs: {
        rpc: { protocol: 'http', host: 'localhost', port: 5001, default: true },
        gateway: 'http://localhost:8080/ipfs',
      },
    },
    template: 'bare-template.aragonpm.eth',
    templateVersion: 'latest',
    fn: 'newInstance',
    fnArgs: [],
    deployEvent: 'DeployDao',
    silent: true,
    debug: false,
  })

  const result = await tasks.run()

  t.assert(Web3.utils.isAddress(result.daoAddress))
})

test('assigns an Aragon Id with the "--aragon-id" param', async t => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  const { stdout } = await runAragonCLI([
    'dao',
    'new',
    '--debug',
    '--aragon-id',
    id,
  ])
  const [, daoId, daoAddress] = stdout.match(daoIdAndAddressAddressRegex)

  t.assert(daoId === id, 'Invalid Aragon Id')
  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
})

test('creates a new DAO with a custom template', async t => {
  const { stdout } = await runAragonCLI([
    'dao',
    'new',
    'membership-template',
    '1.0.0',
    '--fn',
    'newTokenAndInstance',
    '--fn-args',
    'MyToken',
    'TKN',
    `MyDao${new Date().getTime()}`,
    '["0xb4124cEB3451635DAcedd11767f004d8a28c6eE7"]',
    '["500000000000000000", "50000000000000000", "604800"]',
    '1296000',
    'true',
  ])
  const daoAddress = stdout.match(daoAddressRegex)[1]

  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
})
