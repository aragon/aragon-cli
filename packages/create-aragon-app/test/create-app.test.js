import test from 'ava'
import { remove, ensureDirSync, pathExists, readJson } from 'fs-extra'
//
import { normalizeOutput, runCreateAragonApp } from './util'

const testSandbox = './.tmp'
const projectName = 'foobar'
const projectPath = `${testSandbox}/${projectName}`

test.before(async t => {
  if (await pathExists(projectPath)) await remove(projectPath)
})

test.after.always(async () => {
  await remove(projectPath)
})

// eslint-disable-next-line ava/no-skip-test
test('should create a new aragon app based on the buidler boilerplate', async t => {
  ensureDirSync(testSandbox)

  const repoPath = `${projectPath}/.git`
  const arappPath = `${projectPath}/arapp.json`
  const packageJsonPath = `${projectPath}/package.json`
  const licensePath = `${projectPath}/LICENSE`

  const { stdout } = await runCreateAragonApp([
    projectName,
    'buidler',
    '--path',
    './.tmp',
    '--no-install',
  ])

  const packageJson = await readJson(packageJsonPath)
  const arapp = (await readJson(arappPath))

  t.true(normalizeOutput(stdout).includes('Created new application'))
  t.true(await pathExists(projectPath))
  t.true(await pathExists(arappPath))
  t.falsy(await pathExists(repoPath))
  t.falsy(await pathExists(licensePath))
  t.is(undefined, packageJson.license)
  t.is(`${projectName}.aragonpm.eth`, arapp.environments.default.appName)
})
