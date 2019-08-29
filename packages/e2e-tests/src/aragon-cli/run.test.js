import test from 'ava'
import fetch from 'node-fetch'
import { startBackgroundProcess, normalizeOutput } from '@aragon/cli-utils'

const testSandbox = './.tmp'
const projectName = 'foobar'

test('should run an aragon app successfully', async t => {
  t.plan(3)

  // act
  const { stdout, exit } = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['run', '--debug', '--env', 'default'],
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
  const fetchBody = await fetchResult.text()

  // cleanup
  await exit()

  // delete some output sections that are not deterministic
  const appBuildOutput = stdout.substring(
    stdout.indexOf('Building frontend [started]'),
    stdout.indexOf('Building frontend [completed]')
  )
  const publishOutput = stdout.substring(
    stdout.indexOf('Publish app to aragonPM [started]'),
    stdout.indexOf('Publish app to aragonPM [completed]')
  )

  const wrapperInstallOutput = stdout.substring(
    stdout.indexOf('Downloading wrapper [started]'),
    stdout.indexOf('Starting Aragon client [started]')
  )

  const outputToSnapshot = stdout
    .replace(publishOutput, '[deleted-publish-output]')
    .replace(appBuildOutput, '[deleted-app-build-output]')
    .replace(wrapperInstallOutput, '[deleted-wrapper-install-output]')
    .replace(new RegExp(daoAddress, 'g'), '[deleted-dao-address]')

  // assert
  t.snapshot(normalizeOutput(outputToSnapshot))
  t.snapshot(fetchResult.status)
  t.snapshot(fetchBody)
})
