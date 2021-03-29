import parseCli from '../parseCli'

jest.setTimeout(60000)

test('ipfs propagate readme directory', async () => {
  const stdout = await parseCli([
    'ipfs',
    'propagate',
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    '--debug',
  ])

  expect(stdout.includes('Requests succeeded:')).toBe(true)
})
