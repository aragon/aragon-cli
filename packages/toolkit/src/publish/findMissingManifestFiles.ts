import path from 'path'
import fs from 'fs'
import { AragonManifest } from './types'

interface MissingFile {
  path: string
  id: string
  required: boolean
}

/**
 * Verifies that all files declared in the manifest exist in the distPath
 * Run this verification AFTER building the app front-end
 * Returns JSON data so the consumer can choose to show a warning or throw
 * @param manifest
 * @param distPath
 */
export default function findMissingManifestFiles(
  manifest: AragonManifest,
  distPath: string
): MissingFile[] {
  const missingFiles: MissingFile[] = []

  function assertFile(filepath: string, id: string, required: boolean): void {
    // filepath maybe a remote URL, ignore those cases
    if (filepath.includes('://')) return
    const fullPath = path.join(distPath, filepath)
    if (!fs.existsSync(fullPath))
      missingFiles.push({ path: fullPath, id, required })
  }

  // Assert optional metadata
  if (manifest.details_url) assertFile(manifest.details_url, 'details', false)
  manifest.icons.forEach((icon, i) => {
    assertFile(icon.src, `icon ${i}`, false)
  })
  manifest.screenshots.forEach((screenshot, i) => {
    assertFile(screenshot.src, `screenshot ${i}`, false)
  })

  // Assert mandatory files
  assertFile(manifest.start_url, 'start page', true)
  assertFile(manifest.script, 'script', true)

  return missingFiles
}
