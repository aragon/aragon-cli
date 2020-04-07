import test from 'ava'
import parseCli from '../parseCli'

test.serial('ipfs status displays daemon running', async (t) => {
  const stdout = await parseCli(['ipfs', 'status', '--debug'])
  t.assert(stdout.includes('Local installation:'))
})
