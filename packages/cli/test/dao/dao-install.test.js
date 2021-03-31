import parseCli from '../parseCli'
import { getLocalWeb3 } from '../util'
import { userHasCreatePermission } from '@aragon/toolkit'

jest.setTimeout(60000)

let ACCOUNT1, ACCOUNT2

let web3
beforeEach(async () => {
  // Identify accounts
  web3 = await getLocalWeb3()
  const accounts = await web3.eth.getAccounts()
  ACCOUNT1 = accounts[0]
  ACCOUNT2 = accounts[1]
})

afterEach(async () => {
  await web3.currentProvider.connection.close()
})

test('installs a new app', async () => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const stdout = await parseCli(['dao', 'install', id, 'vault', '--debug'])

  expect(stdout.includes('Start IPFS')).toBe(true)
  expect(stdout.includes('Fetching App Manager permissions [skipped]')).toBe(
    true
  )
  expect(stdout.includes('Installed vault.aragonpm.eth')).toEqual(
    true,
    'Unable to install vault'
  )
})

test('check if user has permission to install', async () => {
  const userAddressWithPermission = ACCOUNT1
  const userAddressWithoutPermission = ACCOUNT2
  const dao = await parseCli(['dao', 'new', '--debug'])
  const daoAddress = dao.slice(-43, -1)

  const hasPermission = await userHasCreatePermission(
    daoAddress,
    userAddressWithPermission,
    web3
  )
  const noPermission = await userHasCreatePermission(
    daoAddress,
    userAddressWithoutPermission,
    web3
  )

  expect(hasPermission).toEqual(true)
  expect(noPermission).toEqual(false)
})
