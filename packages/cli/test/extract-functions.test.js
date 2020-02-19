import test from 'ava'
import parseCli from './parseCli'

test.serial('extracts functions to file', async t => {
  const stdout = await parseCli(['extract-functions', 'test/mock/contracts/CounterApp.sol', '--output', 'test/mock/.tmp', '--debug'])

  t.true(stdout.includes('Saved to'))
})
