import test from 'ava'
import killProcessOnPort from 'kill-port'

test('should kill ipfs', async t => {
  t.plan(1)

  // act
  await killProcessOnPort('5001')

  // assert
  t.pass()
})
