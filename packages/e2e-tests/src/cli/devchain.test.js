import test from 'ava'
import { startBackgroundProcess, normalizeOutput } from '../util'

test('should spawn aragon devchain', async t => {
  t.plan(1)

  // act
  const runDevchain = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['devchain', '--reset'],
    readyOutput: 'ℹ Devchain running: http://localhost:8545.',
  })

  // cleanup
  await exit()

  // assert
  t.snapshot(normalizeOutput(runDevchain.stdout))
})
