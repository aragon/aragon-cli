import path from 'path'
import fs from 'fs-extra'

export async function checkProjectExists (basename) {
  const projectPath = path.resolve(process.cwd(), basename)
  const exists = await fs.pathExists(projectPath)

  if (exists) {
    throw new Error(`Couldn't initialize project. Project with name ${basename} already exists in ${projectPath}. Use different <name> or rename existing project folder.`)
  }
}
