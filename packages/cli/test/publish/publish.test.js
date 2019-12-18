import test from 'ava'
import fs from 'fs-extra'
import path from 'path'
import { startProcess } from '@aragon/cli'

const ARTIFACT_FILE = 'artifact.json'
const MANIFEST_FILE = 'manifest.json'

const PUBLISH_CMD_TIMEOUT = 120000 // 2min

const testSandbox = './.tmp/publish'

test('should publish an aragon app directory successfully', async t => {
  const publishDirPath = path.resolve(`${testSandbox}/publish-dir`)

  // act
  await startProcess({
    cmd: 'aragon',
    args: [
      'apm',
      'publish',
      'major',
      '--files',
      'dist',
      '--publish-dir',
      publishDirPath,
      '--skip-confirmation',
      '--no-propagate-content',
    ],
    execaOpts: {
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
