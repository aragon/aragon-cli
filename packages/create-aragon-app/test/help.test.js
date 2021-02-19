import { runCreateAragonApp } from './util'

test('should return the correct version', async () => {
  // act
  const { stdout } = await runCreateAragonApp(['--help'])
  // assert
  expect(stdout.includes('create-aragon-app <name> [template]')).toBe(true)
  expect(stdout.includes('Create a new aragon application')).toBe(true)
  expect(stdout.includes('--path')).toBe(true)
  expect(stdout.includes('Where to create the new app')).toBe(true)
})
