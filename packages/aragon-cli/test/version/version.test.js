import test from 'ava'
import { runAragonCLI } from '../utils'

test('should return the correct version', async t => {
  t.plan(1)

  const stdout = await runAragonCLI(['--version'])

  t.snapshot(stdout)
})
