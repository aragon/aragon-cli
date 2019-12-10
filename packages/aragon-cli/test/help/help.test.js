import test from 'ava'
import { runAragonCLI, normalizeOutput } from '../utils'

test('should return the correct help info', async t => {
  t.plan(1)

  let stdout = await runAragonCLI(['--help'])
  stdout = normalizeOutput(stdout)

  t.snapshot(stdout)
})
