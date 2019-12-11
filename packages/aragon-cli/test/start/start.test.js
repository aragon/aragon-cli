import test from 'ava'
import execa from 'execa'

// eslint-disable-next-line ava/no-skip-test
test.skip('start', async t => {
  t.plan(1)

  const subprocess = execa(
    'node',
    ['dist/cli.js', 'start', '--openInBrowser', false],
    { timeout: 8000 }
  )

  let testPassed = false
  subprocess.stdout.on('data', data => {
    const str = data.toString()

    if (str.includes('started on port')) {
      testPassed = true
      t.pass()
      subprocess.kill('SIGTERM', { forceKillAferTimeout: 2000 })
    }
  })

  try {
    await subprocess
  } catch (err) {
    if (!testPassed) {
      t.fail()
    }
  }
})
