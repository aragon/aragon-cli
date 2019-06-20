import test from 'ava'
import delay from 'delay'
import requireGlob from 'require-glob'
import { startBackgroundProcess, normalizeOutput } from '../util'

const testSandbox = './.tmp/cli'

test.before(async () => {
  console.log('Setup start')
  // spawn aragon devchain
  const runDevchain = await startBackgroundProcess({
    cmd: 'aragon',
    args: ['devchain', '--reset'],
  })
  // arrange
  const projectName = 'foobarfoo'
  await execa('create-aragon-app', [projectName], { cwd: testSandbox })
  // hack, we need to install the dependencies of the app
  await execa('npm', ['install'], { cwd: `${testSandbox}/${projectName}/app` })

  await delay(1000)
  console.log('Setup complete')
})

requireGlob(['./_*.test.js'])
