import test from 'ava'
import { startBackgroundProcess, normalizeOutput } from '../util'

test('should spawn ganache', async t => {
  t.plan(1)

  // act
  const { stdout } = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['devchain', '--verbose', '--debug', '--reset', '--network-id', '1'],
    readyOutput: 'Devchain running',
    // keep this process alive after the test finished
    execaOpts: { detached: true }
  })

  // assert
  t.true(stdout.includes('Devchain running at'))
  // TODO check with web3 if it's all good??
})
