import test from 'ava'
//
import parseCli from '../parseCli'

const daoAddressRegex = /Created DAO: (.*)\n$/
const daoIdAndAddressAddressRegex = /Created DAO: (.*) at (.*)\n$/

test.serial('creates a new DAO', async t => {
  const stdout = await parseCli(['dao', 'new', '--debug'])
  const daoAddress = stdout.match(daoAddressRegex)[1]

  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
})

test.serial('assigns an Aragon Id with the "--aragon-id" param', async t => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  const stdout = await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const [, daoId, daoAddress] = stdout.match(daoIdAndAddressAddressRegex)

  t.assert(daoId === id, 'Invalid Aragon Id')
  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
})

test.serial('creates a new DAO with a custom template', async t => {
  const stdout = await parseCli([
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
    '--debug',
  ])
  const daoAddress = stdout.match(daoAddressRegex)[1]

  const appStdout = await parseCli(['dao', 'apps', daoAddress, '--debug'])

  t.assert(appStdout.includes('voting'))
  t.assert(appStdout.includes('token-manager'))
  t.assert(appStdout.includes('finance'))
  t.assert(appStdout.includes('agent'))

  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
})
