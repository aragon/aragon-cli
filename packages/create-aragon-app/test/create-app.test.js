import { remove, ensureDirSync, pathExists, readJson } from 'fs-extra'
//
import { normalizeOutput, runCreateAragonApp } from './util'

jest.setTimeout(60000)

const testSandbox = './.tmp'
const projectName = 'foobar'
const projectPath = `${testSandbox}/${projectName}`

beforeAll(async () => {
  if (await pathExists(projectPath)) await remove(projectPath)
})

test('remove(projectPath)', async () => {
  await remove(projectPath)
})

test('should create a new aragon app based on the buidler boilerplate', async () => {
  ensureDirSync(testSandbox)

  const repoPath = `${projectPath}/.git`
  const arappPath = `${projectPath}/arapp.json`
  const packageJsonPath = `${projectPath}/package.json`
  const licensePath = `${projectPath}/LICENSE`

  const { stdout } = await runCreateAragonApp([
    projectName,
    'react',
    '--path',
    './.tmp',
    '--no-install',
  ])

  const packageJson = await readJson(packageJsonPath)
  const arapp = await readJson(arappPath)

  expect(normalizeOutput(stdout).includes('Created new application')).toBe(true)
  expect(await pathExists(projectPath)).toBe(true)
  expect(await pathExists(arappPath)).toBe(true)
  expect(await pathExists(repoPath)).toBeFalsy()
  expect(await pathExists(licensePath)).toBeFalsy()
  expect(undefined).toBe(packageJson.license)
  expect(`${projectName}.aragonpm.eth`).toBe(arapp.environments.default.appName)
})
