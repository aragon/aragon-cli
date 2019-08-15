import test from 'ava'
import execa from 'execa'
import { normalizeOutput } from '../util'

const daoAddressRegex = /Created DAO\: (.*)$/

test('assigns an Aragon Id to a DAO address', async t => {
  t.plan(1)

  const daoNewResult = await execa('aragon', ['dao', 'new', '--debug'])
  const daoAddress = daoNewResult.stdout.match(daoAddressRegex)[1]

  // Randomize Aragon Id
  const aragonId = 'newdao' + Math.floor(Math.random() * 100)
  const assignIdResult = await execa('aragon', ['dao', 'id', 'assign', daoAddress, aragonId, '--debug'])
  
  const resultSnapshot = {
    ...daoNewResult,
    cmd: assignIdResult.cmd
      .replace(aragonId, '')    // Since aragonId is random, remove it from snapshot
      .replace(daoAddress, ''), // daoAddress changes as well
    stdout: normalizeOutput(assignIdResult.stdout)
      .replace(daoAddress, '')
      .replace(aragonId, '')
  }

  t.snapshot(resultSnapshot)
})


