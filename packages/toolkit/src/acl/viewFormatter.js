import '../../@types/acl/typedef'

/**
 * Flattens all ACL permissions from an acl object into a single array
 * @param {AclPermissions} permissions Permissions
 * @return {AclPermission[]} acl permissions data
 */
export const flattenAclPermissions = (permissions) => {
  const aclPermissions = []
  for (const [to, roles] of Object.entries(permissions)) {
    for (const [roleHash, data] of Object.entries(roles)) {
      // Verbose assignment for data transparency
      aclPermissions.push({
        to,
        role: roleHash,
        allowedEntities: data.allowedEntities,
        manager: data.manager,
      })
    }
  }
  return aclPermissions
}

/**
 * Formats one acl permission data attaching human readable names to its raw data
 * @param {AclPermission} aclPermission ACL permission data
 * @param {App[]} apps Apps
 * @param {KnownApps} knownApps Known apps
 * @param {KnownRoles} knownRoles Known roles
 * @return {AclPermissionFormatted} with human readable names if any
 */
export const formatAclPermission = (
  aclPermission,
  apps,
  knownApps,
  knownRoles
) => {
  const {
    to: toAddress,
    role: roleHash,
    allowedEntities,
    manager: managerAddress,
  } = aclPermission

  /**
   * Shortcut to TRY get an app name from it's proxy address
   * If the app can't be found, returns an empty string: ''
   * @param  {string} address Proxy address of a possible app
   * @return {AclPermissionAppInfo} app info
   */
  const getAppInfo = (address) => {
    const app = apps.find(({ proxyAddress }) => address === proxyAddress)
    return {
      address,
      name: app ? knownApps[app.appId] || '' : '',
    }
  }

  const knownRole = knownRoles[roleHash]
  const roleId = knownRole ? knownRole.id || '' : ''

  return {
    to: getAppInfo(toAddress),
    manager: getAppInfo(managerAddress),
    allowedEntities: allowedEntities.map(getAppInfo),
    role: {
      hash: roleHash,
      id: roleId,
    },
  }
}

/**
 * Formats acl permissions attaching human readable names to its raw data
 * @param  {AclPermissions} permissions Permissions
 * @param  {App[]} apps Apps
 * @param  {KnownApps} knownApps Known apps
 * @param  {KnownRoles} knownRoles Known roles
 * @return {AclPermissionFormatted[]} Formated acl permissions data
 */
export function formatAclPermissions(permissions, apps, knownApps, knownRoles) {
  return flattenAclPermissions(permissions).map((aclPermission) =>
    formatAclPermission(aclPermission, apps, knownApps, knownRoles)
  )
}
