import { normalizeOutput } from '../../src/util'
import { runAragonCLI } from '../util'

jest.setTimeout(60000)
test('should return the correct help info', async () => {
  let { stdout } = await runAragonCLI(['--help'])
  stdout = normalizeOutput(stdout)

  expect(stdout).toMatchSnapshot()
})
