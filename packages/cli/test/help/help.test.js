import { normalizeOutput } from '../../src/util'
import { runAragonCLI } from '../util'

test('should return the correct help info', async () => {
  let { stdout } = await runAragonCLI(['--help'])
  stdout = normalizeOutput(stdout)

  expect(stdout).toMatchSnapshot()
})
