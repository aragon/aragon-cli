import { keccak256 } from 'web3-utils'
import { keyBy } from 'lodash'
import defaultAppsRoles from '../../../../knownRoles.json'

/**
 * Returns this app roles and default known roles
 *
 * TODO: add support for user apps
 * @param {ArappConfig} module arapp.json contents
 * @return {Object.<string, RoleDefinition>} Unique known roles
 */
export const getKnownRoles = module => {
  const currentAppRoles = module ? module.roles : []
  const allRoles = defaultAppsRoles.concat(currentAppRoles)

  return keyBy(allRoles, role => keccak256(role.id))
}
