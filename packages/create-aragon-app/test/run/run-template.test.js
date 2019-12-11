import test from 'ava'
import fetch from 'node-fetch'
import { startBackgroundProcess, normalizeOutput } from '../../../e2e-tests/src/util'
import fs from 'fs'
import path from 'path'

const testSandbox = './.tmp'
const projectName = 'foobar'

test('should run an aragon app successfully with a Template', async t => {
  t.plan(3)

  // Node.js 11 fix (https://github.com/aragon/aragon-cli/issues/731)
  fs.writeFileSync(
    path.join(testSandbox, projectName, 'truffle.js'),
    `
    module.exports = require('@aragon/os/truffle-config'); 
    module.exports.solc.optimizer.enabled = false;
  `
  )

  // act
  const { stdout, exit } = await startBackgroundProcess({
    cmd: 'aragon',
    args: [
      'run',
      '--files',
      'dist',
      '--template',
      'Template',
      '--template-init',
      '@ARAGON_ENS',
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

  // cleanup
  await exit()

  const appBuildOutput = stdout.substring(
    stdout.indexOf('Building frontend [started]'),
    stdout.indexOf('Building frontend [completed]')
  )

  const outputToSnapshot = stdout
    .replace(appBuildOutput, '[deleted-app-build-output]')
    .replace(new RegExp(daoAddress, 'g'), '[deleted-dao-address]')

  // assert
  t.snapshot(normalizeOutput(outputToSnapshot))
  t.snapshot(fetchResult.status)
  t.snapshot(fetchBody)
})
