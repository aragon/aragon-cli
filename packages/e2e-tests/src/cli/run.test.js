import test from 'ava'
import fetch from 'node-fetch'
import { startBackgroundProcess, normalizeOutput } from '../util'
import fs from 'fs'
import path from 'path'

const testSandbox = './.tmp'
const projectName = 'foobar'

test('should run an aragon app successfully', async t => {
  t.plan(2)

  // Node.js 11 fix (https://github.com/aragon/aragon-cli/issues/731)
  fs.writeFileSync(path.join(testSandbox, projectName, 'truffle.js'), `
    module.exports = require('@aragon/os/truffle-config'); 
    module.exports.solc.optimizer.enabled = false;
  `)

  // act
  const { stdout, exit } = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['run', '--debug', '--files', 'dist', '--reset'],
    execaOpts: {
      cwd: `${testSandbox}/${projectName}`,
      /**
       * By default execa will run the aragon binary that is located at '.tmp/foobar/node_modules'.
       * That is coming from npm and is not the one we want to test.
       *
       * We need to tell it to use the one we just built locally and installed in the e2e-tests package
       */
      preferLocal: true,
      localDir: '.',
    },
    readyOutput: 'Opening http://localhost:3000/#/',
  })

  // hack so the wrapper has time to start
  await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000)) // TODO move to utils

  // finding the DAO address
  const daoAddress = stdout.match(/DAO address: (0x[a-fA-F0-9]{40})/)[1]

  // TODO: fetch the counter app instead
  const fetchResult = await fetch(`http://localhost:3000/#/${daoAddress}`)

  // cleanup
  await exit()

  // assert
  t.true(stdout.includes('You are now ready to open your app in Aragon'))
  t.is(fetchResult.status, 200)
})
