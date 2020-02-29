import test from 'ava'

import parseCli from '../parseCli'

const START_CMD_TIMEOUT = 40000 // 40s

// TODO: Unskip, test don't finish
// eslint-disable-next-line ava/no-skip-test
test.skip('start runs', async t => {
  const output = await parseCli(
    ['start', '--auto-open', 'false', '--debug'],
    START_CMD_TIMEOUT
  )

  t.assert(output.includes('started on port'))
})
