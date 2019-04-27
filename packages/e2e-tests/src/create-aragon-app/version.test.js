import test from 'ava'
import execa from 'execa'

test('should return the correct version', async t => {
  t.plan(1)

  // act
  const result = await execa('create-aragon-app', ['--version'])

  // assert
  t.snapshot(result)
})
