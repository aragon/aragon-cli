import path from 'path'
import execa from 'execa'
import { ensureDir } from 'fs-extra'
import pkgDir from 'pkg-dir'

export function isPackage(dir: string): string {
  return path.join(dir, 'package.json')
}

export async function initPackage(packagePath: string): Promise<string> {
  await ensureDir(packagePath)
  const { stdout } = await execa('npm', ['init', '--yes'], {
    cwd: packagePath,
  })
  return stdout
}

export async function getGlobalPackagesLocation(): Promise<string> {
  const { stdout } = await execa('npm', ['prefix', '--global'])
  return stdout
}

export function getNodePackageManager(): string {
  return 'npm'
}

/**
 * Usage: `const path = getPackageRoot(__dirname)`
 */
export function getPackageRoot(cwd: string): string | undefined {
  return pkgDir.sync(cwd)
}
