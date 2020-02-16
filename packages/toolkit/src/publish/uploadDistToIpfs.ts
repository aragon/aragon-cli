import IpfsHttpClient from 'ipfs-http-client'
import all from 'it-all'
import readIgnoreFiles from './readIgnoreFiles'
const { globSource } = IpfsHttpClient

/**
 * Uploads dist folder to IPFS
 * Applies various ignore patterns:
 * - .ipfsignore
 * - .gitignore
 */
export default async function uploadReleaseToIpfs(
  distPath: string,
  options?: {
    rootPath?: string
    ignorePatterns?: string
    progress?: (totalBytes: number) => void
  }
): Promise<string> {
  const ipfs = IpfsHttpClient()

  const ignore = []
  if (options && Array.isArray(options.ignorePatterns))
    ignore.push(...options.ignorePatterns)
  if (options && options.rootPath)
    ignore.push(...readIgnoreFiles(options.rootPath))

  const results = await all(
    ipfs.add(globSource(distPath, { recursive: true, ignore }))
  )
  const rootDir = results[results.length - 1]
  return rootDir.cid.toString()
}
