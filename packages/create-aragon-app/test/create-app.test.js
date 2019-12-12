import test from 'ava'
import { remove, ensureDirSync, pathExists, readJson } from 'fs-extra'
import { normalizeOutput, runCreateAragonApp } from './util'

const testSandbox = './.tmp'
const projectName = 'foobar'
const projectPath = `${testSandbox}/${projectName}`

test.after.always(async () => {
  await remove(projectPath)
})

test('should create a new aragon app based on the react boilerplate', async t => {
  t.plan(10)

  // arrange
  ensureDirSync(testSandbox)
  const repoPath = `${projectPath}/.git`
  const arappPath = `${projectPath}/arapp.json`
  const packageJsonPath = `${projectPath}/package.json`
  const licensePath = `${projectPath}/LICENSE`

  // act
  const { stdout } = await runCreateAragonApp([
    projectName,
    'react',
    '--path',
    './.tmp',
  ])

  const packageJson = await readJson(packageJsonPath)
  const arapp = await readJson(arappPath)

  // assert
  t.true(normalizeOutput(stdout).includes('Created new application'))
  t.true(await pathExists(projectPath))
  t.true(await pathExists(arappPath))
  t.falsy(await pathExists(repoPath))
  t.falsy(await pathExists(licensePath))
  t.is(undefined, packageJson.license)
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.default.appName)
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.rinkeby.appName)
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.mainnet.appName)
  t.true(await pathExists(`${projectPath}/node_modules/.bin/ipfs`))
})
