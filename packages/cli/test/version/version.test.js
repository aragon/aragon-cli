import test from 'ava'
import { runAragonCLI } from '../util'

test('should return the correct version', async (t) => {
  const result = await runAragonCLI(['--version'])

  delete result.stdout

  t.snapshot(result)
})
