import fs from 'fs'
import path from 'path'

/**
 * Reads ignore files from disk and aggregates their glob patterns
 * into a single array
 * @param rootPath Dir to find ignore files
 */
export default function readIgnoreFiles(rootPath: string): string[] {
  const ignorePatterns: string[] = []
  for (const filename of ['.ipfsignore', '.gitignore']) {
    const fullPath = path.join(rootPath, filename)
    if (!fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf8')
      const ignoreLines = data
        .trim()
        .split('\n')
        .filter(l => l.trim())
      ignorePatterns.push(...ignoreLines)
    }
  }
  return ignorePatterns
}
