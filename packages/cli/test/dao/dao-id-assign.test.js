import { runAragonCLI } from '../util'
import parseCli from '../parseCli'

const daoAddressRegex = /Created DAO: (.*)$/
jest.setTimeout(60000)
test('assigns an Aragon Id to a DAO address', async () => {
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

  expect(assignIdStdout.includes('successfully assigned to')).toBe(true)
})
