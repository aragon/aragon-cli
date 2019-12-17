import test from 'ava'
//
import { normalizeOutput } from '../../src/util'
import { runAragonCLI } from '../util'

test('should return the correct help info', async t => {
  let { stdout } = await runAragonCLI(['--help'])
  stdout = normalizeOutput(stdout)

  t.snapshot(stdout)
})
