import test from 'ava'
import execa from 'execa'
import { normalizeOutput } from '../util'

const daoAddressRegex = /Created DAO: (.*)$/
const daoIdAndAddressAddressRegex = /Created DAO: (.*) at (.*)$/

test('creates a new DAO', async t => {
  t.plan(2)

  const result = await execa('aragon', ['dao', 'new', '--debug'])
  const daoAddress = result.stdout.match(daoAddressRegex)[1]

  const resultSnapshot = normalizeOutput(result.stdout).replace(daoAddress, '')

  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
  t.snapshot(resultSnapshot)
})

test('assigns an Aragon Id with the "--aragon-id" param', async t => {
  t.plan(3)

  const result = await execa('aragon', [
    'dao',
    'new',
    '--debug',
    '--aragon-id',
    'newdao1',
  ])
  const [, daoId, daoAddress] = result.stdout.match(daoIdAndAddressAddressRegex)

  const resultSnapshot = normalizeOutput(result.stdout).replace(daoAddress, '')

  t.assert(daoId === `newdao1.aragonid.eth`, 'Invalid Aragon Id')
  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
  t.snapshot(resultSnapshot)
})
