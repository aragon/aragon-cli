import parseCli from '../parseCli'

const START_CMD_TIMEOUT = 40000

test('start opens a web server', async () => {
  const output = await parseCli(
    ['start', '--auto-open', 'false', '--debug'],
    START_CMD_TIMEOUT
  )

  expect(output.includes('started on port')).toBe(true)
})

test('run fails if not in an aragon project directory', async () => {
  try {
    await parseCli(['run'])
    fail('it should not reach here')
  } catch (error) {}
})
