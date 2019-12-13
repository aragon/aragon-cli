import test from 'ava'
import { runAragonCLI } from '../util'

const daoAddressRegex = /Created DAO: (.*)$/

test('assigns an Aragon Id to a DAO address', async t => {
  t.plan(1)

  const { stdout: daoNewStdout } = await runAragonCLI(['dao', 'new', '--debug'])
  const daoAddress = daoNewStdout.match(daoAddressRegex)[1]

  const id = `newdao-${new Date().getTime()}`
  const { stdout: assignIdStdout } = await runAragonCLI([
    'dao',
    'id',
    'assign',
    daoAddress,
    id,
    '--debug',
  ])

  t.true(assignIdStdout.includes('successfully assigned to'))
})
