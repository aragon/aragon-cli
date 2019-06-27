import test from 'ava'
import fetch from 'node-fetch'
import { startBackgroundProcess, normalizeOutput } from '../util'

test('should spawn ipfs', async t => {
  t.plan(2)

  // act
  const { stdout } = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['ipfs', '--debug'],
    readyOutput: 'IPFS daemon is now running.',
    // keep this process alive after the test finished
    execaOpts: { detached: true }
  })
  const res = await fetch('http://localhost:5001/api/v0/version')
  const body = await res.text()

  // assert
  t.snapshot(normalizeOutput(stdout))
  t.snapshot(JSON.parse(body).Version)
  // TODO check that ipfs pins our aragen-cache
})
