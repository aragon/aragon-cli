import path from 'path'
import fs from 'fs-extra'
import replace from 'replace'

/**
 * Remove the `.git` dir, licenses and rename the app name and registry.
 * (It will search and replace anything that matches `placeholder-app-name`)
 *
 * @param {string} dir - for example `foo`
 * @param {string} appName - for example `foo.myApmRegistry.eth`
 * @returns {void}
 */
export async function prepareTemplate(dir, appName) {
  /**
   * Delete .git
   */
  const gitFolderPath = path.resolve(dir, '.git')

  /**
   * Delete licenses
   */
  const licensePath = path.resolve(dir, 'LICENSE')
  const packageJsonPath = path.resolve(dir, 'package.json')
  const packageJson = await fs.readJson(packageJsonPath)
  delete packageJson.license

  /**
   * Replace the default registries with the preferred one
   */
  const defaultRegistries = [
    // To keep backwards compability, only change `aragonpm.eth`, leave `open.aragonpm.eth`
    'placeholder-app-name.aragonpm.eth',
    // 'placeholder-app-name.open.aragonpm.eth',
  ]

  defaultRegistries.forEach(registry => {
    replace({
      regex: registry,
      replacement: appName,
      paths: [dir],
      recursive: true,
      silent: true,
    })
  })

  /**
   * Replace the placeholder name with the actual name
   */
  replace({
    regex: 'placeholder-app-name',
    replacement: dir,
    paths: [dir],
    recursive: true,
    silent: true,
  })

  return Promise.all([
    fs.writeJson(packageJsonPath, packageJson, { spaces: 2 }),
    fs.remove(gitFolderPath),
    fs.remove(licensePath),
  ])
}
