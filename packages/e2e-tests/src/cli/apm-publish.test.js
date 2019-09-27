import test from 'ava'
import fs from 'fs-extra'
import path from 'path'
import { startBackgroundProcess, normalizeOutput } from '../util'

const ARTIFACT_FILE = 'artifact.json'
const MANIFEST_FILE = 'manifest.json'

const testSandbox = './.tmp'
const projectName = 'foobar'

test.skip('should publish an aragon app directory successfully', async t => {
  t.plan(3)

  const publishDirPath = path.resolve(`${testSandbox}/publish-dir`)

  // act
  const publishProcess = await startBackgroundProcess({
    cmd: 'aragon',
    args: [
      'apm',
      'publish',
      'major',
      '--build',
      'false',
      '--publish-dir',
      publishDirPath,
      '--env',
      'rinkeby',
      '--debug',
    ],
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
    readyOutput: 'Successfully published',
  })

  // cleanup
  await publishProcess.exit()

  // check the generated artifact
  const artifactPath = path.resolve(publishDirPath, ARTIFACT_FILE)
  const artifact = JSON.parse(fs.readFileSync(artifactPath))
  // delete non-deterministic values
  delete artifact.deployment

  // check the generated manifest
  const manifestPath = path.resolve(publishDirPath, MANIFEST_FILE)
  const manifest = JSON.parse(fs.readFileSync(manifestPath))

  // delete some output sections that are not deterministic
  // TODO: Delete propagate content output
  const prepublishScriptOutput = stdout.substring(
    stdout.indexOf('Running prepublish script [started]'),
    stdout.indexOf('Running prepublish script [completed]')
  )

  const appDeploymentOutput = publishProcess.stdout.substring(
    publishProcess.stdout.indexOf('Fetch published repo [completed]')
  )

  const outputToSnapshot = publishProcess.stdout
    .replace(prepublishScriptOutput, '[deleted-prepublish-script-output]')
    .replace(
      appDeploymentOutput,
      'Fetch published repo [completed][deleted-app-deployment-output]'
    )

  // assert
  t.snapshot(normalizeOutput(outputToSnapshot))
  t.snapshot(artifact)
  t.snapshot(manifest)
})
