import test from 'ava'
import { startBackgroundProcess, normalizeOutput } from '../util'

const testSandbox = './.tmp'
const projectName = 'foobar'

test('should run an aragon app successfully', async t => {
  t.plan(3)

  // act
  const runProcess = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['run', '--debug'],
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
  const daoAddress = runProcess.stdout.match(
    /DAO address: (0x[a-fA-F0-9]{40})/
  )[1]

  // TODO: fetch the counter app instead
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
