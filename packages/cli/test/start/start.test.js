import parseCli from '../parseCli'
const { killProcessOnPort } = require('../../../toolkit')

jest.setTimeout(160000)

const START_CMD_TIMEOUT = 60000

test('start opens a web server', async () => {
  const output = await parseCli(
    ['start', '--auto-open', 'false', '--debug'],
    START_CMD_TIMEOUT
  )

  expect(output.includes('started on port')).toBe(true)

  await killProcessOnPort(parseInt(output.substring(output.length - 5)))
})

test('run fails if not in an aragon project directory', async () => {
  try {
    await parseCli(['run'])
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {}
})
