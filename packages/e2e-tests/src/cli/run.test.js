import test from 'ava'
import fs from 'fs-extra'
import fetch from 'node-fetch'
import execa from 'execa'
import { startBackgroundProcess, normalizeOutput } from '../util'

const testSandbox = './.tmp/run'

test.beforeEach(() => {
  fs.ensureDirSync(testSandbox)
})

test.afterEach(() => {
  fs.removeSync(testSandbox)
})

test('should create a new aragon app and run it successfully', async t => {
  t.plan(3)

  // arrange
  const projectName = 'foobarfoo'

  // act
  await execa('create-aragon-app', [projectName], { cwd: testSandbox })
  const runProcess = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['run', '--debug'],
    execaOpts: { cwd: `${testSandbox}/${projectName}` },
    readyOutput: 'Opening http://localhost:3000/#/',
  })

  // hack so the wrapper has time to start
  await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000))

  // finding the DAO address
  const daoAddress = runProcess.stdout.match(/DAO address: (0x[a-fA-F0-9]{40})/)[1]
  
  // TODO fetch the counter app
  const fetchResult = await fetch(`http://localhost:3000/#/${daoAddress}`)
  const fetchBody = await fetchResult.text()
  
  // cleanup
  await runProcess.exit()

  // assert
  t.snapshot(normalizeOutput(runProcess.stdout))
  t.snapshot(fetchResult.status)
  t.snapshot(fetchBody)
})
