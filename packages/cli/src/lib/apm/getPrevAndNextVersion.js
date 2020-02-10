import semver from 'semver'
import {
  APM_INITIAL_VERSIONS,
  getApmRepo,
  apmIsValidBump,
} from '@aragon/toolkit'

export class InvalidBump extends Error {}

/**
 * @typedef {Object} PrevAndNextVersionReturn
 * @property {Object} [initialRepo]
 * @property {string} [prevVersion]
 * @property {string} [version]
 * @property {boolean} [shouldDeployContract]
 */

/**
 * Compute the next version and return previous repo and version
 * @param {string} appName "finance.aragonpm.eth"
 * @param {string} bumpOrVersion "minor" | "0.1.4"
 * @param {*} web3 todo
 * @param {*} apmOptions todo
 * @return {PrevAndNextVersionReturn} Multiple values, check JSDoc
 */
export async function getPrevAndNextVersion(
  appName,
  bumpOrVersion,
  web3,
  apmOptions
) {
  try {
    const initialRepo = await getApmRepo(web3, appName, apmOptions)
    const prevVersion = initialRepo.version
    const version = resolveBumpOrVersion(bumpOrVersion, prevVersion)
    const isValid = await apmIsValidBump(
      web3,
      appName,
      prevVersion,
      version,
      apmOptions
    )
    if (!isValid) throw new InvalidBump()

    return {
      initialRepo,
      prevVersion,
      version,
      shouldDeployContract: semver.major(prevVersion) !== semver.major(version),
    }
  } catch (e) {
    if (e.message.includes('Invalid content URI')) {
      return {}
    }
    // Repo doesn't exist yet, deploy the first version
    const version = resolveBumpOrVersion(bumpOrVersion, '0.0.0')
    if (!APM_INITIAL_VERSIONS.includes(version)) {
      const validVersionsList = APM_INITIAL_VERSIONS.join(', ')
      throw Error(
        `Invalid initial version '${version}', valid values: ${validVersionsList}`
      )
    }

    return {
      version,
      shouldDeployContract: true, // assume first version should deploy a contract
    }
  }
}

/**
 * Get bumped version
 * @param {string} bumpOrVersion "minor" | "0.1.4"
 * @param {string} prevVersion Version to bump from: "0.1.0"
 * @return {string} resulting sem version: "0.2.0"
 */
function resolveBumpOrVersion(bumpOrVersion, prevVersion) {
  return semver.valid(bumpOrVersion)
    ? semver.valid(bumpOrVersion)
    : semver.inc(prevVersion, bumpOrVersion)
}
