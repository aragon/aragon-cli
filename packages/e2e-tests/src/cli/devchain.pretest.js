import test from 'ava'
import { startBackgroundProcess, normalizeOutput } from '../util'

test('should spawn ganache', async t => {
  t.plan(1)

  // act
  const { stdout } = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['devchain', '--verbose', '--debug', '--reset'],
    readyOutput: 'Devchain running',
    // keep this process alive after the test finished
    execaOpts: { detached: true }
  })

  // assert
  t.snapshot(normalizeOutput(stdout))
  // TODO check with web3 if it's all good??
})
