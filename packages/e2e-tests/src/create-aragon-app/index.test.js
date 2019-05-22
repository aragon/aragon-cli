import test from 'ava'
import execa from 'execa'
import fs from 'fs-extra'

const testSandbox = './.tmp/create-aragon-app'

test.beforeEach(() => {
  fs.ensureDirSync(testSandbox)
})

test.afterEach(() => {
  fs.removeSync(testSandbox)
})

test('should create a new aragon app', async t => {
  t.plan(8)

  // arrange
  const name = 'foobar'
  const projectPath = `${testSandbox}/${name}`
  const repoPath = `${projectPath}/.git`
  const arappPath = `${projectPath}/arapp.json`
  const packageJsonPath = `${projectPath}/package.json`
  const licensePath = `${projectPath}/LICENSE`

  // act
  const result = await execa('create-aragon-app', [name], { cwd: testSandbox })

  const packageJson = await fs.readJson(packageJsonPath)
  const arapp = await fs.readJson(arappPath)

  // assert
  t.true(await fs.pathExists(projectPath))
  t.true(await fs.pathExists(arappPath))
  t.falsy(await fs.pathExists(repoPath))
  t.falsy(fs.pathExistsSync(licensePath))
  t.is(undefined, packageJson.license)
  t.is(`${name}.aragonpm.eth`, arapp.environments.default.appName)
  t.is(`${name}.open.aragonpm.eth`, arapp.environments.rinkeby.appName)
  t.is(`${name}.open.aragonpm.eth`, arapp.environments.mainnet.appName)
})
