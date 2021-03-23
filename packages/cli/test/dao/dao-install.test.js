import parseCli from '../parseCli'

jest.setTimeout(60000)

test('installs a new app', async () => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const stdout = await parseCli(['dao', 'install', id, 'vault', '--debug'])

  expect(stdout.includes('Start IPFS')).toBe(true)
  expect(stdout.includes('Installed vault.aragonpm.eth')).toEqual(
    true,
    'Unable to install vault'
  )
})
