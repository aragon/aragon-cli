import test from 'ava'
import execa from 'execa'

test('runs the encode example without errors', async t => {
  const subprocess = execa('node', ['examples/encode.js'])

  // Uncomment to see script running during testing.
  // subprocess.stdout.pipe(process.stdout)

  await subprocess

  t.pass()
})
