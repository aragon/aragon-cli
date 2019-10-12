const sha3 = require('web3').utils
const keccak256 = x => '0x' + sha3.keccak_256(x)
const path = require('path')
const { findProjectRoot } = require('../../../../util')
const defaultAppsRoles = require('../../../../knownRoles.json')

const currentAppRoles = () => {
  try {
    const arappPath = path.resolve(findProjectRoot(), 'arapp.json')
    return require(arappPath).roles || []
  } catch (_) {
    return []
  }
}

// TODO: add support for user apps
const rolesForApps = () => {
  const allRoles = defaultAppsRoles.concat(currentAppRoles())
  const knownRoles = allRoles.reduce(
    (acc, role) => Object.assign(acc, { [keccak256(role.id)]: role }),
    {}
  )

  return knownRoles
}

module.exports = { rolesForApps }
