import test from 'ava'
import { startProcess } from '@aragon/toolkit'

const START_CMD_TIMEOUT = 40000 // 40s

test('start', async t => {
  const cliPath = 'dist/cli.js'

  // act
  const { kill } = await startProcess({
    cmd: 'node',
    args: [cliPath, 'start'],
    execaOpts: {
      localDir: '.',
    },
    readyOutput: 'started on port',
    timeout: START_CMD_TIMEOUT,
  })

  // cleanup
  await kill()

  // assert
  t.pass()
})
