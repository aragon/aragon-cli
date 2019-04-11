import test from 'ava'
import execa from 'execa'

test('should return the correct version', async t => {
  t.plan(1)

  // act
  const result = await execa('aragon', ['--version'])

  // assert
  t.snapshot(result)
})
