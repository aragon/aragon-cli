import test from 'ava'
//
import { runCreateAragonApp } from './util'

test('should return the correct version', async t => {
  // act
  const { stdout } = await runCreateAragonApp(['--help'])
  // assert
  t.true(stdout.includes('create-aragon-app <name> [template]'))
  t.true(stdout.includes('Create a new aragon application'))
  t.true(stdout.includes('--path'))
  t.true(stdout.includes('Where to create the new app'))
})
