import test from 'ava'
import fs from 'fs-extra'
import path from 'path'
import { startProcess } from '@aragon/toolkit'

const ARTIFACT_FILE = 'artifact.json'
const MANIFEST_FILE = 'manifest.json'

const PUBLISH_CMD_TIMEOUT = 120000 // 2min
const VERSIONS_CMD_TIMEOUT = 50000 // 50s

const testSandbox = './.tmp/publish'

const mockappPath = path.resolve('./test/mock')

const cliPath = '../../dist/cli.js'

test.serial('should publish an aragon app directory successfully', async t => {
  // arrange
  const publishDirPath = path.resolve(`${mockappPath}/${testSandbox}`)

  // act
  await startProcess({
    cmd: 'node',
    args: [
      cliPath,
      'apm',
      'publish',
      'major',
      '--files',
      'app',
      '--publish-dir',
      publishDirPath,
      '--skip-confirmation',
      '--no-propagate-content',
    ],
    execaOpts: {
      cwd: mockappPath,
      localDir: '.',
    },
    readyOutput: 'Successfully published',
    timeout: PUBLISH_CMD_TIMEOUT,
  })

  // check the generated artifact
  const artifactPath = path.resolve(publishDirPath, ARTIFACT_FILE)
  const artifact = JSON.parse(fs.readFileSync(artifactPath))
  // delete non-deterministic values
  delete artifact.deployment

  // check the generated manifest
  const manifestPath = path.resolve(publishDirPath, MANIFEST_FILE)
  const manifest = JSON.parse(fs.readFileSync(manifestPath))

  // assert
  t.snapshot(artifact)
  t.snapshot(manifest)
})

test.serial('should fetch published versions to aragonPM', async t => {
  // act
  await startProcess({
    cmd: 'node',
    args: [cliPath, 'apm', 'versions'],
    execaOpts: {
      cwd: mockappPath,
      localDir: '.',
    },
    readyOutput: 'mock-app.open.aragonpm.eth has',
    timeout: VERSIONS_CMD_TIMEOUT,
  })

  // assert
  t.pass()
})
