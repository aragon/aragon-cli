import test from 'ava'
//
import { runCreateAragonApp, normalizeOutput } from './util'

test('should return the correct version', async t => {
  // act
  const { stdout } = await runCreateAragonApp(['--help'])
  // assert
  t.snapshot(normalizeOutput(stdout))
})
