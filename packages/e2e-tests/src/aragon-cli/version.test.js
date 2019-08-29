import test from 'ava'
import execa from 'execa'

test('should return the correct version', async t => {
  t.plan(1)

  // act
  const result = await execa('aragon', ['--version'])

  // cleanup
  // we don't care about the version, only that the command did not fail
  delete result.stdout

  // assert
  t.snapshot(result)
})
