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
  await execa('create-aragon-app', [projectName], { cwd: testSandbox })
  // hack, we need to install the dependencies of the app
  await execa('npm', ['install'], { cwd: `${testSandbox}/${projectName}/app` })

  // act
  const runProcess = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['run', '--debug', '--reset'],
    execaOpts: {
      cwd: `${testSandbox}/${projectName}`,
      /**
       * By default execa will run the aragon binary that is located at '.tmp/run/foobarfoo/node_modules'.
       * That is coming from npm and is not the one we want to test.
       *
       * We need to tell it to use the one we just built locally and installed in the e2e-tests package
       */
      preferLocal: true,
      localDir: '.'
    },
    readyOutput: 'Opening http://localhost:3000/#/',
  })

  // hack so the wrapper has time to start
  await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000))

  // finding the DAO address
  const daoAddress = runProcess.stdout.match(/DAO address: (0x[a-fA-F0-9]{40})/)[1]

  // TODO fetch the counter app instead
  const fetchResult = await fetch(`http://localhost:3000/#/${daoAddress}`)
  const fetchBody = await fetchResult.text()

  // cleanup
  await runProcess.exit()

  // delete some output sections that are not deterministic
  const appBuildOutput = runProcess.stdout.substring(
    runProcess.stdout.indexOf('Building frontend [started]'),
    runProcess.stdout.indexOf('Building frontend [completed]')
  )
  const wrapperInstallOutput = runProcess.stdout.substring(
    runProcess.stdout.indexOf('Downloading wrapper [started]'),
    runProcess.stdout.indexOf('Starting Aragon client [started]')
  )

  const outputToSnapshot = runProcess.stdout
    .replace(appBuildOutput, '')
    .replace(wrapperInstallOutput, '')

  // assert
  t.snapshot(normalizeOutput(outputToSnapshot))
  t.snapshot(fetchResult.status)
  t.snapshot(fetchBody)
})
