import path from 'path'
import ignore from 'ignore'
import fs from 'fs'
import { copy, pathExistsSync } from 'fs-extra'
import { promisify } from 'util'

//
import { findProjectRoot } from '../../../util'

export const MANIFEST_FILE = 'manifest.json'
export const ARTIFACT_FILE = 'artifact.json'

/**
 * Moves the specified files to a temporary directory and returns the path to
 * the temporary directory.
 * @param {string} tmpDir Temporary directory
 * @param {Array<string>} files An array of file paths to include
 * @param {string} ignorePatterns An array of glob-like pattern of files to ignore
 * @return {string} The path to the temporary directory
 */
export async function prepareFilesForPublishing(
  tmpDir,
  files = [],
  ignorePatterns = null
) {
  // Ignored files filter
  const filter = ignore().add(ignorePatterns)
  const projectRoot = findProjectRoot()

  const ipfsignorePath = path.resolve(projectRoot, '.ipfsignore')
  if (pathExistsSync(ipfsignorePath)) {
    const ipfsignoreFile = fs.readFileSync(ipfsignorePath).toString()
    filter.add(ipfsignoreFile)
  } else {
    const gitignorePath = path.resolve(projectRoot, '.gitignore')
    if (pathExistsSync(gitignorePath)) {
      const gitignoreFile = fs.readFileSync(gitignorePath).toString()
      filter.add(gitignoreFile)
    }
  }

  function filterIgnoredFiles(src) {
    const relativeSrc = path.relative(projectRoot, src)
    return relativeSrc === '' ? true : !filter.ignores(relativeSrc)
  }

  // Copy files
  await Promise.all(
    files.map(async file => {
      const stats = await promisify(fs.lstat)(file)

      let destination = tmpDir
      if (stats.isFile()) {
        destination = path.resolve(tmpDir, file)
      }

      // check files are not ignored
      if (filter.ignores(file)) filter.add(`!${file}`)

      if (filter.ignores(file + '/')) filter.add(`!${file}/`)

      return copy(file, destination, {
        filter: filterIgnoredFiles,
      })
    })
  )

  const manifestOrigin = path.resolve(projectRoot, MANIFEST_FILE)
  const manifestDst = path.resolve(tmpDir, MANIFEST_FILE)

  if (!pathExistsSync(manifestDst) && pathExistsSync(manifestOrigin)) {
    await copy(manifestOrigin, manifestDst)
  }

  const artifactOrigin = path.resolve(projectRoot, ARTIFACT_FILE)
  const artifactDst = path.resolve(tmpDir, ARTIFACT_FILE)

  if (!pathExistsSync(artifactDst) && pathExistsSync(artifactOrigin)) {
    await copy(artifactOrigin, artifactDst)
  }

  return tmpDir
}
