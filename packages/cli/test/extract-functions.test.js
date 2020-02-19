import test from 'ava'
import path from 'path'

import parseCli from './parseCli'

const START_CMD_TIMEOUT = 20000 // 20s

test.serial('extract-functions', async t => {
  const stdout = await parseCli(['extract-functions', 'test/mock/contracts/CounterApp.sol', '--output', 'test/mock/.tmp', '--debug'])

  t.true(stdout.includes('Saved to'))
})
