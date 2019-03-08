import test from 'ava'
import fetch from 'node-fetch'
import { startBackgroundProcess, normalizeOutput } from '../util'

test('should spawn ipfs', async t => {
  t.plan(2)

  // act
  const { exit, stdout } = await startBackgroundProcess('aragon', ['ipfs', '--debug'], 'IPFS daemon is now running.')
  const res = await fetch('http://localhost:5001/api/v0/version')
  const body = await res.text()

  // cleanup
  await exit()

  // assert
  t.snapshot(normalizeOutput(stdout))
  t.snapshot(JSON.parse(body).Version)
  // TODO check that ipfs pins our aragen-cache
})
