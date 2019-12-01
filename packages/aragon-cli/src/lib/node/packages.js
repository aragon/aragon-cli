import { join as joinPath } from 'path'
import execa from 'execa'
import { ensureDir } from 'fs-extra'

export const isPackage = dir => joinPath(dir, 'package.json')
export const initPackage = async dir => {
  await ensureDir(dir)
  const { stdout } = await execa('npm', ['init', '--yes'], {
    cwd: dir,
  })
  return stdout
}

export const getGlobalPackagesLocation = async () => {
  const { stdout } = await execa('npm', ['prefix', '--global'])
  return stdout
}
