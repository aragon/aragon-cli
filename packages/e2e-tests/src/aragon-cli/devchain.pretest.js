/* eslint-disable ava/no-ignored-test-files */
import test from 'ava'
import { startBackgroundProcess, normalizeOutput } from '@aragon/cli-utils'

test('should spawn ganache', async t => {
  t.plan(1)

  // act
  const { stdout } = await startBackgroundProcess({
    cmd: 'aragon',
    args: [
      'devchain',
      '--env',
      'aragon:devchain',
      '--verbose',
      '--debug',
      '--reset',
      '--network-id',
      '1',
    ],
    readyOutput: 'Devchain running',
    // keep this process alive after the test finished
    execaOpts: { detached: true },
  })

  // assert
  t.snapshot(normalizeOutput(stdout))
  // TODO check with web3 if it's all good??
})
