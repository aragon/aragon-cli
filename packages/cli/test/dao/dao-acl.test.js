import parseCli from '../parseCli'

const daoAddressRegex = /Created DAO: (.*)\n$/

jest.setTimeout(60000)

test('acl view', async () => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const stdout = await parseCli(['dao', 'acl', 'view', id, '--debug'])

  expect(stdout.includes('App')).toBe(true)
  expect(stdout.includes('Action')).toBe(true)
  expect(stdout.includes('Allowed entities')).toBe(true)
  expect(stdout.includes('Manager')).toBe(true)
  expect(stdout.includes('CREATE_PERMISSIONS_ROLE')).toBe(true)
})

test('acl grant', async () => {
  const newDaoStdout = await parseCli(['dao', 'new', '--debug'])
  const daoAddress = newDaoStdout.match(daoAddressRegex)[1]

  const stdout = await parseCli([
    'dao',
    'acl',
    'grant',
    daoAddress,
    daoAddress,
    'APP_MANAGER_ROLE',
    '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
    '--debug',
  ])

  expect(stdout.includes('Successfully executed')).toEqual(
    true,
    'Unable to grant APP_MANAGER_ROLE role'
  )
})
