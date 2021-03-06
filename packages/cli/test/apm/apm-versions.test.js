import parseCli from '../parseCli'

test('fetches app versions', async () => {
  const output = await parseCli(['apm', 'versions', 'voting', '--debug'])

  expect(output.includes('voting.aragonpm.eth')).toBe(true)
})
