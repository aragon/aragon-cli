/* eslint-disable ava/no-ignored-test-files */
import test from 'ava'
import killProcessOnPort from 'kill-port'

test('should kill ganache', async t => {
  t.plan(1)

  // act
  await killProcessOnPort('8545')

  // assert
  t.pass()
})
