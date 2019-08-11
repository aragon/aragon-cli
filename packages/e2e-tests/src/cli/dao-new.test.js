import test from 'ava'
import execa from 'execa'
import { normalizeOutput } from '../util'



test('creates a new DAO', async t => {
  t.plan(2)

  const daoAddressRegex = /Created DAO\: (.*)$/
  const result = await execa('aragon', ['dao', 'new', '--debug'])
  const daoAddress = result.stdout.match(daoAddressRegex)[1]
  
  const resultSnapshot = {
    ...result,
    stdout: normalizeOutput(result.stdout)
      .replace(daoAddress, '')
  }

  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
  t.snapshot(resultSnapshot)

})
