import { serial as test } from 'ava'
import killProcessOnPort from 'kill-port'
import { remove } from 'fs-extra'

const testSandbox = './.tmp/ipfs-project'

test('should kill ipfs', async t => {
  t.plan(1)

  // act
  await killProcessOnPort('5001')

  // assert
  t.pass()
})

test('should uninstall ipfs from the project (if installed)', async t => {
  // act
  await remove(testSandbox)

  // assert
  t.pass()
})
