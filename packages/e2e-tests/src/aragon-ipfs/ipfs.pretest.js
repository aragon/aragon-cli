import { serial as test } from 'ava'
import execa from 'execa'
import { normalizeOutput } from '@aragon/cli-utils'

test('should install ipfs globally (U-IPFS-1A)', async t => {
  // arrange
  t.plan(1)

  // act
  const { stdout } = await execa('aragon-ipfs', [
    'install',
    '--skip-confirmation',
  ])

  // assert
  t.snapshot(normalizeOutput(stdout))
})

test('should start the ipfs daemon', async t => {
  // arrange
  t.plan(1)

  // act
  const { stdout } = await execa('aragon-ipfs', ['start'])

  // assert
  t.snapshot(normalizeOutput(stdout))
})

test('should show that the ipfs daemon is started', async t => {
  // arrange
  t.plan(2)

  // act
  const { stdout } = await execa('aragon-ipfs', ['status'])
  // let's check that we can also call the 'ipfs' binary directly
  const { stdout: versionOutput } = await execa('ipfs', ['version'])

  // assert
  t.snapshot(normalizeOutput(stdout))
  t.snapshot(normalizeOutput(versionOutput))
})
