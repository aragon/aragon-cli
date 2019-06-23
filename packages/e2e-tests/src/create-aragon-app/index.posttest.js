import test from 'ava'
import fs from 'fs-extra'

const testSandbox = './.tmp'

test('should clean the aragon app created for tests', async t => {
  t.plan(1)

  // act
  fs.removeSync(testSandbox)

  // assert
  t.pass()
})
