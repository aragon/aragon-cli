import test from 'ava'
import execa from 'execa'
import { normalizeOutput } from '../util'

const daoAddressRegex = /Created DAO\: (.*)$/

test('assigns an Aragon Id to a DAO address', async t => {
  t.plan(1)

  const daoNewResult = await execa('aragon', ['dao', 'new', '--debug'])
  const daoAddress = daoNewResult.stdout.match(daoAddressRegex)[1]

  const assignIdResult = await execa('aragon', ['dao', 'id', 'assign', daoAddress, 'newdao2', '--debug'])
  
  t.true(assignIdResult.stdout.includes('successfully assigned to'))
})


