import test from 'ava'
import fs from 'fs-extra'
const path = require('path')
import execa from 'execa'
import { startBackgroundProcess, normalizeOutput } from '../util'

const ARTIFACT_FILE = 'artifact.json'
const MANIFEST_FILE = 'manifest.json'

const testSandbox = './.tmp/cli'
const projectName = 'foobarfoo'

const runDevchain

test.before(async () => {
  // arrange

  fs.ensureDirSync(testSandbox)

  // spawn aragon devchain
  runDevchain = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['devchain', '--reset'],
    readyOutput: 'ℹ Devchain running: http://localhost:8545.',
  })

  await execa('create-aragon-app', [projectName], { cwd: testSandbox })
  // hack, we need to install the dependencies of the app
  await execa('npm', ['install'], { cwd: `${testSandbox}/${projectName}/app` })

  console.log('Setup complete')
})


test('should publish an aragon app directory successfully', async t => {
  t.plan(3)

  const publishDirPath = path.resolve(`${testSandbox}/publish-dir`)

  // act
  const runProcess = await startBackgroundProcess({
    cmd: 'aragon',
    args: [
      'apm',
      'publish',
      'major',
      '--build',
      'false',
      '--publish-dir',
      publishDirPath,
      '--debug',
    ],
    execaOpts: {
      cwd: `${testSandbox}/${projectName}`,
      /**
       * By default execa will run the aragon binary that is located at '.tmp/apm/foobarfoo/node_modules'.
       * That is coming from npm and is not the one we want to test.
       *
       * We need to tell it to use the one we just built locally and installed in the e2e-tests package
       */
      preferLocal: true,
      localDir: '.',
    },
    readyOutput:
      ' ✔ Successfully published foobarfoo.open.aragonpm.eth v1.0.0:',
  })

  // cleanup
  await runProcess.exit()

  // Check generated artifact
  const artifactPath = path.resolve(publishDirPath, ARTIFACT_FILE)
  let artifact = JSON.parse(fs.readFileSync(artifactPath))
  // delete not deterministic values
  delete artifact.deployment

  // Check generated manifest
  const manifestPath = path.resolve(publishDirPath, MANIFEST_FILE)
  const manifest = JSON.parse(fs.readFileSync(manifestPath))

  // delete some output sections that are not deterministic
  const appBuildOutput = runProcess.stdout.substring(
    runProcess.stdout.indexOf('Building frontend [started]'),
    runProcess.stdout.indexOf('Building frontend [completed]')
  )

  const outputToSnapshot = runProcess.stdout.replace(appBuildOutput, '')

  // assert
  t.snapshot(normalizeOutput(outputToSnapshot))
  t.snapshot(artifact)
  t.snapshot(manifest)
})

test('should run an aragon app successfully', async t => {
  t.plan(3)

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
      localDir: '.',
    },
    readyOutput: 'Opening http://localhost:3000/#/',
  })

  // hack so the wrapper has time to start
  await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000))

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


test.after(async () => {
 // cleanup
  fs.removeSync(testSandbox)
  await runDevchain.exit()
});