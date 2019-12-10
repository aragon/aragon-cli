import { join as joinPath } from 'path'
import execa from 'execa'
import { ensureDir } from 'fs-extra'

export const isPackage = dir => joinPath(dir, 'package.json')
export const initPackage = async path => {
  await ensureDir(path)
  const { stdout } = await execa('npm', ['init', '--yes'], {
    cwd: path,
  })
  return stdout
}

export const getGlobalPackagesLocation = async () => {
  const { stdout } = await execa('npm', ['prefix', '--global'])
  return stdout
}

export const getNodePackageManager = () => {
  return 'npm'
}
