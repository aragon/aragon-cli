import fs from 'fs-extra'

import { checkProjectExists, prepareTemplate } from '../src/lib'
import isValidAragonId from '../src/helpers/is-valid-aragonid'

import defaultAPMName from '../src/helpers/default-apm'

const dirPath = './.tmp'
const basename = 'aragon-app'
const projectPath = './.tmp/aragon-app'

beforeEach(() => {
  fs.ensureDirSync(projectPath)
})

afterEach(() => {
  fs.removeSync(projectPath)
})

test('project name validation', () => {
  expect(isValidAragonId('testproject')).toBe(true)
  expect(isValidAragonId('project2')).toBe(true)
  expect(isValidAragonId('test-project')).toBe(true)

  expect(isValidAragonId('testProject')).toBe(false)
  expect(isValidAragonId('test_project')).toBe(false)
})

test('check if project folder already exists', async () => {
  try {
    await checkProjectExists(dirPath, basename)
    fail('it should not reach here')
  } catch (err) {}
})

test('prepare project template', async () => {
  const repoPath = `${projectPath}/.git`
  const arappPath = `${projectPath}/arapp.json`
  const packageJsonPath = `${projectPath}/package.json`
  const licensePath = `${projectPath}/LICENSE`
  const appName = defaultAPMName('TestApp')

  await fs.ensureDir(repoPath)
  await fs.ensureFile(arappPath)
  await fs.ensureFile(packageJsonPath)
  await fs.ensureFile(licensePath)
  await fs.writeJson(arappPath, {
    environments: {
      default: {
        appName: 'placeholder-app-name.aragonpm.eth',
      },
      staging: {
        appName: 'placeholder-app-name.open.aragonpm.eth',
      },
      production: {
        appName: 'placeholder-app-name.open.aragonpm.eth',
      },
    },
  })
  await fs.writeJson(packageJsonPath, {
    license: 'MIT',
    version: '0.0.1',
  })

  await prepareTemplate(dirPath, basename, appName)
  const project = await fs.readJson(arappPath)
  const packageJson = await fs.readJson(packageJsonPath)

  expect(await fs.pathExists(repoPath)).toBeFalsy()
  expect(undefined).toBe(packageJson.license)
  expect(fs.pathExistsSync(licensePath)).toBeFalsy()
  expect(`${appName}`).toBe(project.environments.default.appName)
  expect(`${basename}.open.aragonpm.eth`).toBe(
    project.environments.staging.appName
  )
  expect(`${basename}.open.aragonpm.eth`).toBe(
    project.environments.production.appName
  )
})
