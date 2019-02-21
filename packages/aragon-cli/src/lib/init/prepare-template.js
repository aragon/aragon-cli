import path from 'path'
import fs from 'fs-extra'

export async function prepareTemplate(dir, appName) {
  const basename = appName.split('.')[0]
  const arappPath = path.resolve(dir, 'arapp.json')
  const arapp = await fs.readJson(arappPath)

  const defaultEnv = arapp.environments.default
  const stagingEnv = arapp.environments.staging
  const productionEnv = arapp.environments.production

  defaultEnv.appName = appName
  stagingEnv.appName = stagingEnv.appName.replace(/^app/, basename)
  productionEnv.appName = productionEnv.appName.replace(/^app/, basename)

  Object.assign(arapp.environments.default, defaultEnv)
  Object.assign(arapp.environments.staging, stagingEnv)
  Object.assign(arapp.environments.production, productionEnv)

  const gitFolderPath = path.resolve(dir, '.git')
  const licensePath = path.resolve(dir, 'LICENSE')

  const packageJsonPath = path.resolve(dir, 'package.json')
  const packageJson = await fs.readJson(packageJsonPath)
  delete packageJson.license

  return Promise.all([
    fs.writeJson(arappPath, arapp, { spaces: 2 }),
    fs.writeJson(packageJsonPath, packageJson, { spaces: 2 }),
    fs.remove(gitFolderPath),
    fs.remove(licensePath),
  ])
}
