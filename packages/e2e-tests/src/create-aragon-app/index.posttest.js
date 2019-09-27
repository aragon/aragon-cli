import test from 'ava'
import { remove } from 'fs-extra'

const testSandbox = './.tmp/foobar'

test('should clean the aragon app created for tests', async t => {
  t.plan(1)

  // act
  await remove(testSandbox)

  // assert
  t.pass()
})
