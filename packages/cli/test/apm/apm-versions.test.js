import test from 'ava'
//
import parseCli from '../parseCli'

test('fetches app versions', async (t) => {
  const output = await parseCli(['apm', 'versions', 'voting', '--debug'])

  t.assert(output.includes('voting.aragonpm.eth'))
})
