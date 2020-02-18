import test from 'ava'

import parseCli from '../parseCli'

const START_CMD_TIMEOUT = 20000 // 20s

test.serial('start command opens the client by default', async t => {
  const stdout = await parseCli(['start', '--debug'], START_CMD_TIMEOUT)

  t.assert(stdout.includes('Opening client'))
})


test.serial('start command should start', async t => {
  const stdout = await parseCli(['start', '--auto-open', 'false', '--debug'], START_CMD_TIMEOUT)

  t.assert(stdout.includes('Aragon client'))
  t.assert(stdout.includes('started on port'))
})

test.serial('run fails if not in an aragon project directory', async t => {
  await t.throwsAsync(async () => {
    return parseCli(['run'])
  })
})
