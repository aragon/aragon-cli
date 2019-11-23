import path from 'path'
import fs from 'fs-extra'
import { findProjectRoot } from '../util'
import Ajv from 'ajv'
import arappSchema from '../../schemas/arapp.schema'

const ajv = new Ajv({ allErrors: true })

/**
 * Looks for a filename recursively up from the cwd
 * Return null if the file is not found or can't be loaded
 * @param {string} fileName
 * @return {Object|undefined} Parsed file JSON content
 */
function loadJsonFileIfFound(fileName) {
  try {
    const filePath = path.resolve(findProjectRoot(), fileName)
    return fs.readJsonSync(filePath)
  } catch (e) {
    return undefined
  }
}

/**
 * Loads the arapp.json file. If it's non existent, it returns null
 * @return {Object|undefined}
 */
export function loadArappFile() {
  const arapp = loadJsonFileIfFound('arapp.json')
  if (!arapp) return undefined // use undefined not null; for default values

  const validate = ajv.compile(arappSchema)
  const valid = validate(arapp)
  if (!valid) {
    throw Error(
      `Error parsing arapp.json:
${ajv.errorsText(validate.errors, { dataVar: 'arapp', separator: '\n' })}`
    )
  }

  return arapp
}

export function loadManifestFile() {
  return loadJsonFileIfFound('manifest.json')
}
