import path from 'path'
import fs from 'fs-extra'

export async function prepareTemplate(basename, appName) {
  const arappPath = path.resolve(basename, 'arapp.json')
  const arapp = await fs.readJson(arappPath)

  const defaultEnv = arapp.environments.default
  const stagingEnv = arapp.environments.staging
  const productionEnv = arapp.environments.production

  defaultEnv.appName = appName
  Object.assign(arapp.environments.default, defaultEnv)

  stagingEnv.appName = stagingEnv.appName.replace(/^app/, appName)
  productionEnv.appName = productionEnv.appName.replace(/^app/, appName)

  Object.assign(arapp.environments.staging, stagingEnv)
  Object.assign(arapp.environments.production, productionEnv)

  const gitFolderPath = path.resolve(basename, '.git')
  const licensePath = path.resolve(basename, 'LICENSE')

  const packageJsonPath = path.resolve(basename, 'package.json')
  const packageJson = await fs.readJson(packageJsonPath)
  delete packageJson.license

  return Promise.all([
    fs.writeJson(arappPath, arapp, { spaces: 2 }),
    fs.writeJson(packageJsonPath, packageJson, { spaces: 2 }),
    fs.remove(gitFolderPath),
    fs.remove(licensePath),
  ])
}
