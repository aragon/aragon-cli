import test from 'ava'
//
import { runCreateAragonApp } from '../util'

test('should return the correct version', async t => {
  // act
  const result = await runCreateAragonApp(['--version'])

  // cleanup
  // we don't care about the version, only that the command did not fail
  delete result.stdout

  // assert
  t.snapshot(result)
})
