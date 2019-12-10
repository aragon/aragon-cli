import test from 'ava'
import { runAragonCLI, normalizeOutput } from '../utils'

const daoAddressRegex = /Created DAO: (.*)$/
const daoIdAndAddressAddressRegex = /Created DAO: (.*) at (.*)$/

test('creates a new DAO', async t => {
  t.plan(2)

  const stdout = await runAragonCLI(['dao', 'new'])
  const daoAddress = stdout.match(daoAddressRegex)[1]

  const resultSnapshot = normalizeOutput(stdout).replace(daoAddress, '')

  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
  t.snapshot(resultSnapshot)
})

test.skip('assigns an Aragon Id with the "--aragon-id" param', async t => {
  t.plan(3)

  const stdout = await runAragonCLI([
    'dao',
    'new',
    '--debug',
    '--aragon-id',
    'newdao1',
  ])
  const [, daoId, daoAddress] = stdout.match(daoIdAndAddressAddressRegex)

  const resultSnapshot = normalizeOutput(stdout).replace(daoAddress, '')

  t.assert(daoId === `newdao1.aragonid.eth`, 'Invalid Aragon Id')
  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
  t.snapshot(resultSnapshot)
})
