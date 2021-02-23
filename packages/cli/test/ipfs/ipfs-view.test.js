import parseCli from '../parseCli'

test('ipfs view readme directory', async () => {
  const stdout = await parseCli([
    'ipfs',
    'view',
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    '--debug',
  ])

  expect(stdout.includes('about')).toEqual(
    true,
    "Directory doesn't contain about file"
  )
  expect(stdout.includes('help')).toEqual(
    true,
    "Directory doesn't contain help file"
  )
  expect(stdout.includes('contact')).toEqual(
    true,
    "Directory doesn't contain contact file"
  )
})
