import test from 'ava'
//
import { runAragonCLI } from '../util'
import parseCli from '../parseCli'

const daoAddressRegex = /Created DAO: (.*)$/

test('assigns an Aragon Id to a DAO address', async (t) => {
  const { stdout: daoNewStdout } = await runAragonCLI(['dao', 'new', '--debug'])
  const daoAddress = daoNewStdout.match(daoAddressRegex)[1]

  const id = `newdao-${new Date().getTime()}`
  const assignIdStdout = await parseCli([
    'dao',
    'id',
    'assign',
    daoAddress,
    id,
    '--debug',
  ])

  t.true(assignIdStdout.includes('successfully assigned to'))
})
