import fs from 'fs-extra'
import { homedir } from 'os'
import path from 'path'

const aragonConfig = '.aragon'

/**
 * tests whether or not the given path exists by checking with the file system.
 * @param filepath path
 */
export const pathExists = (filepath: string): boolean => fs.existsSync(filepath)

/**
 * Read file contents as JSON
 * @param filepath path
 */
export const readJson = <T>(filepath: string): T => fs.readJsonSync(filepath)

/**
 * Read file contents as JSON or if the path doesn't exists returns undefined
 * @param filepath path
 */
export const readJsonIfExists = <T>(filepath: string): T | undefined =>
  pathExists(filepath) ? readJson<T>(filepath) : undefined

/**
 * Utility to read JSON files from aragonConfig dirs
 * Returns undefined if the file does not exist
 * @param filename 'mnemonic.json'
 */
export function readAragonConfig<T>(filename: string): T | undefined {
  return readJsonIfExists(path.join(homedir(), aragonConfig, filename))
}
