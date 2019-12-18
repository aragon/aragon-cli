import test from 'ava'
import path from 'path'
import { startProcess } from '@aragon/cli'

const RUN_CMD_TIMEOUT = 1800000 // 3min

const testSandbox = './.tmp/run'
const publishDirPath = path.resolve(`${testSandbox}/publish-dir`)

// const cliPath = 'dist/cli.js'

test('should run an aragon app successfully on IPFS', async t => {
  // act
  const { kill } = await startProcess({
    cmd: 'npm',
    args: ['run', 'start', '--', '--publish-dir', publishDirPath],
    execaOpts: {
      localDir: '.',
    },
    readyOutput: 'Opening http://localhost:3000/#/',
    timeout: RUN_CMD_TIMEOUT,
    logger: console.log,
  })

  // cleanup
  await kill()

  // assert
  t.pass()
  // t.snapshot(fetchResult.status)
  // t.snapshot(fetchBody)
})
