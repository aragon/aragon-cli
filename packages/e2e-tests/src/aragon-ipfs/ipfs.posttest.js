import { serial as test } from 'ava'
import execa from 'execa'
import { normalizeOutput } from '@aragon/cli-utils'

test('should stop the ipfs daemon', async t => {
  t.plan(1)

  // act
  const { stdout } = await execa('aragon-ipfs', ['stop'])

  // assert
  t.snapshot(normalizeOutput(stdout))
})

test('should show that the ipfs daemon is stopped ', async t => {
  // arrange
  t.plan(1)

  // act
  const { stdout } = await execa('aragon-ipfs', ['status'])

  // assert
  t.snapshot(normalizeOutput(stdout))
})

test('should uninstall ipfs globally', async t => {
  // arrange
  t.plan(1)

  // act
  const { stdout } = await execa('aragon-ipfs', [
    'uninstall',
    '--skip-confirmation',
  ])

  // assert
  t.snapshot(normalizeOutput(stdout))
})

test('should show that the ipfs daemon is uninstalled ', async t => {
  // arrange
  t.plan(1)

  // act
  const { stdout } = await execa('aragon-ipfs', ['status'])

  // assert
  t.snapshot(normalizeOutput(stdout))
})
