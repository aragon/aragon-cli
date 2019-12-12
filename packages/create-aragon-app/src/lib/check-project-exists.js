import path from 'path'
import fs from 'fs-extra'

export async function checkProjectExists(dirPath, basename) {
  const projectPath = path.resolve(dirPath, basename)
  const exists = await fs.pathExists(projectPath)

  if (exists) {
    throw new Error(
      `Couldn't initialize project. Project with name ${basename} already exists in ${dirPath}. Use different <name> or rename existing project folder.`
    )
  }
}
