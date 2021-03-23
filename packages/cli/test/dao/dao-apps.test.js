import parseCli from '../parseCli'

jest.setTimeout(60000)

test('lists apps from DAO', async () => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const stdout = await parseCli(['dao', 'apps', id, '--debug'])

  expect(stdout.includes('App')).toBe(true)
  expect(stdout.includes('Proxy address')).toBe(true)
  expect(stdout.includes('Content')).toBe(true)
  expect(stdout.includes('kernel')).toBe(true)
})

test('lists all apps from DAO', async () => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])

  // Install permissionless app
  await parseCli(['dao', 'install', id, 'vault', '--debug'])

  const stdout = await parseCli(['dao', 'apps', id, '--all', '--debug'])

  expect(stdout.includes('Permissionless app')).toBe(true)
})
