import test from 'ava'
import execa from 'execa'
import { normalizeOutput } from '../util'

test('should return the correct help info', async t => {
  t.plan(1)

  // act
  const result = await execa('aragon', ['--help'])
  
  // assert
  result.stdout = normalizeOutput(result.stdout)

  // Remove web3 warning on node 8 and 9
  if (result.stderr.includes('You can improve web3'))
    result.stderr = ''

  t.snapshot(result);
})
