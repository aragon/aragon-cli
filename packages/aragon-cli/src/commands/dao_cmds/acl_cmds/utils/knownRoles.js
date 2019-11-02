const { keccak256 } = require('web3').utils
const { keyBy } = require('lodash')
const defaultAppsRoles = require('../../../../knownRoles.json')

/**
 * Returns this app roles and default known roles
 *
 * TODO: add support for user apps
 * @param {ArappConfig} module arapp.json contents
 * @return {Object.<string, RoleDefinition>} Unique known roles
 */
const getKnownRoles = module => {
  const currentAppRoles = module.roles || []
  const allRoles = defaultAppsRoles.concat(currentAppRoles)

  return keyBy(allRoles, role => keccak256(role.id))
}

module.exports = { getKnownRoles }
