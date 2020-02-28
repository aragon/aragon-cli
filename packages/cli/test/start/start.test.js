import test from 'ava'
import parseCli from '../parseCli'

// Timeout increased 600s temporarily due to https://github.com/aragon/aragen/issues/101
const START_CMD_TIMEOUT = 600000

test.serial('start opens a web server', async t => {
  const output = await parseCli(
    ['start', '--auto-open', 'false', '--debug'],
    START_CMD_TIMEOUT
  )

  t.assert(output.includes('started on port'))
})

test.serial('run fails if not in an aragon project directory', async t => {
  await t.throwsAsync(async () => {
    return parseCli(['run'])
  })
})
