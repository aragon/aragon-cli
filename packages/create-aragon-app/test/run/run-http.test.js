import test from 'ava'
import fetch from 'node-fetch'
import { startBackgroundProcess, normalizeOutput } from '../util'
import fs from 'fs'
import path from 'path'

const testSandbox = './.tmp'
const projectName = 'foobar'

test('should run an aragon app successfully on HTTP', async t => {
  t.plan(5)

  // Node.js 11 fix (https://github.com/aragon/aragon-cli/issues/731)
  fs.writeFileSync(
    path.join(testSandbox, projectName, 'truffle.js'),
    `
    module.exports = require('@aragon/os/truffle-config'); 
    module.exports.solc.optimizer.enabled = false;
  `
  )

  // act
  const appProcess = await startBackgroundProcess({
    cmd: 'npm',
    args: ['run', 'start:app'],
    execaOpts: {
      cwd: `${testSandbox}/${projectName}`,
      localDir: '.',
    },
    readyOutput: 'Server running at http://localhost:8001',
  })

  const { stdout, exit } = await startBackgroundProcess({
    cmd: 'aragon',
    args: [
      'run',
      '--http',
      'localhost:8001',
      '--http-served-from',
      './dist',
      '--reset',
    ],
    execaOpts: {
      cwd: `${testSandbox}/${projectName}`,
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
  const fetchBody = await fetchResult.text()

  // fetch app
  const fetchApp = await fetch(`http://localhost:8001`)
  const fetchAppBody = await fetchApp.text()

  // cleanup
  await appProcess.exit()
  await exit()

  const outputToSnapshot = stdout.replace(
    new RegExp(daoAddress, 'g'),
    '[deleted-dao-address]'
  )

  // assert
  t.snapshot(normalizeOutput(outputToSnapshot))
  t.snapshot(fetchResult.status)
  t.snapshot(fetchApp.status)
  t.snapshot(fetchBody)
  t.snapshot(fetchAppBody)
})
