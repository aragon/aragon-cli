import test from 'ava'
import fs from 'fs-extra'

import { checkProjectExists, prepareTemplate } from '../src/lib'

import defaultAPMName from '../src/helpers/default-apm'

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
  const appName = defaultAPMName('TestApp')
  const basename = appName.split('.')[0]

  await fs.ensureDir(repoPath)
  await fs.ensureFile(arappPath)
  await fs.ensureFile(packageJsonPath)
  await fs.ensureFile(licensePath)
  await fs.writeJson(arappPath, {
    environments: {
      default: {
        appName: 'app.aragonpm.eth',
      },
      staging: {
        appName: 'app.open.aragonpm.eth',
      },
      production: {
        appName: 'app.open.aragonpm.eth',
      },
    },
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
  t.is(`${appName}`, project.environments.default.appName)
  t.is(`${basename}.open.aragonpm.eth`, project.environments.staging.appName)
  t.is(`${basename}.open.aragonpm.eth`, project.environments.production.appName)
})
