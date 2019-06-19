const path = require('path')
const ignore = require('ignore')
const fs = require('fs')
const { findProjectRoot } = require('../../../util')
const { copy, pathExistsSync } = require('fs-extra')
const { promisify } = require('util')

const MANIFEST_FILE = 'manifest.json'
const ARTIFACT_FILE = 'artifact.json'

/**
 * Moves the specified files to a temporary directory and returns the path to
 * the temporary directory.
 * @param {string} tmpDir Temporary directory
 * @param {Array<string>} files An array of file paths to include
 * @param {string} ignorePatterns An array of glob-like pattern of files to ignore
 * @return {string} The path to the temporary directory
 */
async function prepareFilesForPublishing(
  tmpDir,
  files = [],
  ignorePatterns = null
) {
  // Ignored files filter
  const filter = ignore().add(ignorePatterns)
  const projectRoot = findProjectRoot()

  function createFilter(files, ignorePath) {
    let f = fs.readFileSync(ignorePath).toString()
    files.forEach(file => {
      f = f.concat(`\n!${file}`)
    })
    return f
  }

  const ipfsignorePath = path.resolve(projectRoot, '.ipfsignore')
  if (pathExistsSync(ipfsignorePath)) {
    filter.add(createFilter(files, ipfsignorePath))
  } else {
    const gitignorePath = path.resolve(projectRoot, '.gitignore')
    if (pathExistsSync(gitignorePath)) {
      filter.add(createFilter(files, gitignorePath))
    }
  }

  const replaceRootRegex = new RegExp(`^${projectRoot}`)
  function filterIgnoredFiles(src) {
    const relativeSrc = src.replace(replaceRootRegex, '.')
    return !filter.ignores(relativeSrc)
  }

  // Copy files
  await Promise.all(
    files.map(async file => {
      const stats = await promisify(fs.lstat)(file)

      let destination = tmpDir
      if (stats.isFile()) {
        destination = path.resolve(tmpDir, file)
      }

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

module.exports = { MANIFEST_FILE, ARTIFACT_FILE, prepareFilesForPublishing }
