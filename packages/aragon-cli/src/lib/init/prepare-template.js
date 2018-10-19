import path from 'path'
import fs from 'fs-extra'

export async function prepareTemplate (basename, appName) {
  const arappPath = path.resolve(basename, 'arapp.json')
  const arapp = await fs.readJson(arappPath)

  arapp.appName = appName

  const gitFolderPath = path.resolve(basename, '.git')

  return Promise.all([
    fs.writeJson(arappPath, arapp, { spaces: 2 }),
    fs.remove(gitFolderPath)
  ])
}
