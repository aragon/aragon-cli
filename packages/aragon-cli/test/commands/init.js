import test from 'ava'
import fs from 'fs-extra'

import { checkProjectExists, prepareTemplate } from '../../src/lib/init'

const projectPath = './.tmp/aragon-app'

test.beforeEach(t => {
  fs.ensureDirSync(projectPath)
})

test.afterEach(t => {
  fs.removeSync(projectPath)
})

test('check if project folder already exists', async t => {
  try {
    await checkProjectExists(projectPath)
    t.fail()
  } catch (err) {
    t.pass()
  }
})

test('prepare project template', async t => {
  const repoPath = `${projectPath}/.git`
  const arappPath = `${projectPath}/arapp.json`
  const packageJsonPath = `${projectPath}/package.json`
  const licensePath = `${projectPath}/LICENSE`
  const appName = 'TestApp'

  await fs.ensureDir(repoPath)
  await fs.ensureFile(arappPath)
  await fs.ensureFile(packageJsonPath)
  await fs.ensureFile(licensePath)
  await fs.writeJson(arappPath, {
    appName: 'boilerplate-placeholder',
  })
  await fs.writeJson(packageJsonPath, {
    license: 'MIT',
    version: '0.0.1',
  })

  await prepareTemplate(projectPath, appName)
  const project = await fs.readJson(arappPath)
  const packageJson = await fs.readJson(packageJsonPath)

  t.falsy(await fs.pathExists(repoPath))
  t.is(undefined, packageJson.license)
  t.falsy(fs.pathExistsSync(licensePath))
  t.is(appName, project.environments.default.appName)
})
