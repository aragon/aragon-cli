/* eslint @typescript-eslint/no-var-requires: "off" */

import path from 'path'
import fs from 'fs-extra'
import Ajv from 'ajv'
//
import { findProjectRoot } from '../util'
import { arappSchema } from '../schemas'
import { AragonAppJson, AragonEnvironments } from '../types'

const ajv = new Ajv({ allErrors: true })

const OLD_ENS_REGISTRY = '0x314159265dd8dbb310642f98f50c066173c1259b'
const NEW_ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

/**
 * Looks for a filename recursively up from the cwd
 * Return null if the file is not found or can't be loaded
 * @param fileName
 * @return Parsed file JSON content
 */
function loadJsonFileIfFound<T>(fileName: string): T | undefined {
  try {
    const filePath = path.resolve(findProjectRoot(), fileName)
    return fs.readJsonSync(filePath)
  } catch (e) {
    return undefined
  }
}

/**
 * Check mainnet ENS registry on arapp.json and switch to new address
 * @param {Object} environments environments
 * @return {Object} Mutated environments
 */
function checkMainnetEnsMigration(
  environments: AragonEnvironments
): AragonEnvironments {
  const { mainnet } = environments
  if (mainnet && mainnet.registry && mainnet.registry === OLD_ENS_REGISTRY) {
    environments.mainnet.registry = NEW_ENS_REGISTRY
    console.log(
      `\n
      The ENS registry on mainnet migrate to ${NEW_ENS_REGISTRY}
      You still have the old registry configure on arapp.json.
      Update your mainnet environmnet with the new registry address.
      `
    )
  }
  return environments
}

/**
 * Loads the arapp.json file. If it's non existent, it returns null
 * @return {Object|undefined}
 */
export function loadArappFile(): AragonAppJson | undefined {
  const arapp = loadJsonFileIfFound<AragonAppJson>('arapp.json')
  if (!arapp) return undefined // use undefined not null; for default values

  const validate = ajv.compile(arappSchema)
  const valid = validate(arapp)
  if (!valid) {
    throw Error(
      `Error parsing arapp.json:
${ajv.errorsText(validate.errors, { dataVar: 'arapp', separator: '\n' })}`
    )
  }

  return {
    ...arapp,
    environments: checkMainnetEnsMigration(arapp.environments),
  }
}

export function loadManifestFile() {
  return loadJsonFileIfFound('manifest.json')
}

/**
 * Loads the truffle config file. If it's non existent, it returns null
 * @return {Object|undefined}
 */
export const getTruffleConfig = () => {
  if (fs.existsSync(`${findProjectRoot()}/truffle.js`)) {
    const truffleConfig = require(`${findProjectRoot()}/truffle.js`)
    return truffleConfig
  }

  if (fs.existsSync(`${findProjectRoot()}/truffle-config.js`)) {
    const truffleConfig = require(`${findProjectRoot()}/truffle-config.js`)
    return truffleConfig
  }

  throw new Error(`Didn't find any truffle.js file`)
}
