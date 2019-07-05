import { serial as test } from 'ava'
import fetch from 'node-fetch'
import execa from 'execa'
import { startBackgroundProcess, normalizeOutput } from '../util'
import { writeJson, ensureDir } from 'fs-extra'
import { join as joinPath } from 'path'

const testSandbox = './.tmp/ipfs-project'

test('should install ipfs in a project', async t => {
  t.plan(1)

  // arrange
  await ensureDir(testSandbox)
  const packageJson = {
    name: 'ipfs-project'
  }
  const packagePath = joinPath(testSandbox, 'package.json')
  // act
  await writeJson(packagePath, packageJson)
  const { stdout } = await execa('aragon', ['ipfs', 'install', '--skip-confirmation', '--local'], {
    cwd: testSandbox
  })

  // assert
  const summaryOutput = stdout.substring(
    stdout.indexOf('Determine location [completed]'),
    stdout.indexOf('Install IPFS [started]')
  )
  const outputToSnapshot = stdout.replace(summaryOutput, '[deleted-os-specific-output]')
  t.snapshot(normalizeOutput(outputToSnapshot))
})

test('should spawn ipfs', async t => {
  t.plan(2)

  // act
  const { stdout } = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['ipfs', '--debug'],
    readyOutput: 'IPFS daemon is now running.',
    // keep this process alive after the test finished
    execaOpts: {
      detached: true,
      cwd: testSandbox
    }
  })
  const res = await fetch('http://localhost:5001/api/v0/version')
  const body = await res.text()

  // assert
  t.snapshot(normalizeOutput(stdout))
  t.snapshot(JSON.parse(body).Version)
  // TODO check that ipfs pins our aragen-cache
})
