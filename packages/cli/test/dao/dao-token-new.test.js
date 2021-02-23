import parseCli from '../parseCli'

test('creates a new token', async () => {
  const stdout = await parseCli([
    'dao',
    'token',
    'new',
    'MyToken',
    'TKN',
    '--debug',
  ])

  expect(stdout.includes('Successfully deployed the token')).toEqual(
    true,
    "Can't deploy token"
  )
  expect(stdout.includes('Successfully deployed the token factory')).toEqual(
    true,
    "Can't deploy token factory"
  )
})
