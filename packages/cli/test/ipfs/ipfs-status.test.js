import parseCli from '../parseCli'

test('ipfs status displays daemon running', async () => {
  const stdout = await parseCli(['ipfs', 'status', '--debug'])
  expect(stdout.includes('Local installation:')).toBe(true)
})
