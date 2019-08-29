/* eslint-disable ava/no-ignored-test-files */
import test from 'ava'
import fs from 'fs-extra'
import { startBackgroundProcess, normalizeOutput } from '@aragon/cli-utils'

const testSandbox = './.tmp'

test('should create a new aragon app', async t => {
  t.plan(9)

  // arrange
  fs.ensureDirSync(testSandbox)
  const projectName = 'foobar'
  const projectPath = `${testSandbox}/${projectName}`
  const repoPath = `${projectPath}/.git`
  const arappPath = `${projectPath}/arapp.json`
  const packageJsonPath = `${projectPath}/package.json`
  const licensePath = `${projectPath}/LICENSE`

  // act
  const { stdout } = await startBackgroundProcess({
    cmd: 'create-aragon-app',
    args: [projectName, '--debug'],
    readyOutput: 'Created new application',
    execaOpts: { cwd: testSandbox },
  })

  // hack, we need to install the dependencies of the app
  // await execa("npm", ["install"], { cwd: `${testSandbox}/${projectName}/app` });

  const packageJson = await fs.readJson(packageJsonPath)
  const arapp = await fs.readJson(arappPath)

  // delete some output sections that are not deterministic
  const installingDependenciesOutput = stdout.substring(
    stdout.indexOf('Installing package dependencies [started]'),
    stdout.indexOf('Installing package dependencies [completed]')
  )

  const outputToSnapshot = stdout.replace(
    installingDependenciesOutput,
    '[deleted-installing-dependencies-output]\n'
  )

  // assert
  t.snapshot(normalizeOutput(outputToSnapshot))
  t.true(await fs.pathExists(projectPath))
  t.true(await fs.pathExists(arappPath))
  t.falsy(await fs.pathExists(repoPath))
  t.falsy(fs.pathExistsSync(licensePath))
  t.is(undefined, packageJson.license)
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.default.appName)
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.rinkeby.appName)
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.mainnet.appName)
})
