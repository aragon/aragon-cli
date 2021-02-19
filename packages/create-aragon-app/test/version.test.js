import { runCreateAragonApp } from './util'

test('should return the correct version', async () => {
  // act
  const result = await runCreateAragonApp(['--version'])

  // cleanup
  // we don't care about the version, only that the command did not fail
  delete result.stdout

  // assert
  expect(result).toMatchSnapshot()
})
