import { jsonInterfaceMethodToString } from 'web3-utils'
import { runAragonCLI } from '../util'

jest.setTimeout(60000)
test.skip('should return the correct version', async () => {
  const result = await runAragonCLI(['--version'])

  delete result.stdout

  expect(result).toMatchSnapshot()
})
