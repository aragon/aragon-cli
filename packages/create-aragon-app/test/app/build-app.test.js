import test from 'ava'
import { startBackgroundProcess } from '../util'

const testSandbox = './.tmp'
const projectName = 'foobar'

test('should build an aragon app successfully', async t => {
  t.plan(1)

  // act
  await startBackgroundProcess({
    cmd: 'npm',
    args: ['run', 'build'],
    execaOpts: {
      cwd: `${testSandbox}/${projectName}`,
      localDir: '.',
    },
    readyOutput: '../dist/script.js',
  })

  // assert
  t.pass()
})
