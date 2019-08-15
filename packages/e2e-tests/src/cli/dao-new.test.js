import test from 'ava'
import execa from 'execa'
import { normalizeOutput } from '../util'

const daoAddressRegex = /Created DAO\: (.*)$/
const daoIdAndAddressAddressRegex = /Created DAO\: (.*) at (.*)$/

test('creates a new DAO', async t => {
  t.plan(2)

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

test('assigns an Aragon Id with the "--aragon-id" param', async t => {
  t.plan(3)

  // Randomize Aragon Id
  const aragonId = 'newdao' + Math.floor(Math.random() * 100)
  const result = await execa('aragon', ['dao', 'new', '--debug', '--aragon-id', aragonId ])
  const [,daoId, daoAddress] = result.stdout.match(daoIdAndAddressAddressRegex)
  
  const resultSnapshot = {
    ...result,
    cmd: result.cmd.replace(aragonId, ''), // Since aragonId is random, remove it from snapshot
    stdout: normalizeOutput(result.stdout)
      .replace(daoId, '')
      .replace(daoAddress, '')
  }
 
  t.assert(daoId === `${aragonId}.aragonid.eth`, 'Invalid Aragon Id')
  t.assert(/0x[a-fA-F0-9]{40}/.test(daoAddress), 'Invalid DAO address')
  t.snapshot(resultSnapshot)
})
