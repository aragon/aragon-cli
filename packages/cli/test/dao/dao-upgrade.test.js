import parseCli from '../parseCli'

test('upgrades an app', async () => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  await parseCli(['dao', 'install', id, 'vault', '--debug'])
  const stdout = await parseCli(['dao', 'upgrade', id, 'vault', '--debug'])

  expect(stdout.includes('Start IPFS')).toBe(true)
  expect(stdout.includes('Successfully executed')).toEqual(
    true,
    'Unable to upgrade vault'
  )
})
