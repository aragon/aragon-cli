import test from 'ava'
import fs from 'fs-extra'
const path = require('path')
import execa from 'execa'
import { startBackgroundProcess, normalizeOutput } from '../util'

const ARTIFACT_FILE = 'artifact.json'

const testSandbox = './.tmp/apm'

test.beforeEach(() => {
  fs.ensureDirSync(testSandbox)
})

test.afterEach(() => {
  fs.removeSync(testSandbox)
})

test('should publish an aragon app directory successfully', async t => {
  t.plan(2)

  // arrange
  const projectName = 'foobarfoo'
  const publishDirPath = path.resolve(`${testSandbox}/publish-dir`)

  await execa('create-aragon-app', [projectName], { cwd: testSandbox })
  // hack, we need to install the dependencies of the app
  await execa('npm', ['install'], { cwd: `${testSandbox}/${projectName}/app` })

  // start local chain
  const runDevchain = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['devchain', '--reset'],
    execaOpts: {
      cwd: `${testSandbox}`,
    },
    readyOutput: 'Local chain started',
  })

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
    readyOutput: 'Published directory:',
  })

  // cleanup
  await runDevchain.exit()

  // Check generated artifact
  const artifactPath = path.resolve(publishDirPath, ARTIFACT_FILE)
  const artifact = JSON.parse(fs.readFileSync(artifactPath))

  // delete some output sections that are not deterministic
  const appBuildOutput = runProcess.stdout.substring(
    runProcess.stdout.indexOf('Building frontend [started]'),
    runProcess.stdout.indexOf('Building frontend [completed]')
  )

  const publishDirOutput = runProcess.stdout.substring(
    runProcess.stdout.indexOf('Published directory:')
  )

  const outputToSnapshot = runProcess.stdout
    .replace(appBuildOutput, '')
    .replace(publishDirOutput, '')

  // assert
  t.snapshot(normalizeOutput(outputToSnapshot))
  t.snapshot(artifact)
})
