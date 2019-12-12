import test from 'ava'
import { startBackgroundProcess } from '../util'

const testSandbox = './.tmp'
const projectName = 'foobar'

// eslint-disable-next-line ava/no-skip-test
test.skip('should build an aragon app successfully', async t => {
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
