import {
  AclPermissions,
  AclPermission,
  App,
  KnownApps,
  KnownRoles,
  AclPermissionFormatted,
  AclPermissionAppInfo,
} from '../types'

/**
 * Flattens all ACL permissions from an acl object into a single array
 * @param permissions Permissions
 * @return ACL permissions data
 */
export const flattenAclPermissions = (
  permissions: AclPermissions
): AclPermission[] => {
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
 * @param aclPermission ACL permission data
 * @param apps Apps
 * @param knownApps Known apps
 * @param knownRoles Known roles
 * @return With human readable names if any
 */
export const formatAclPermission = (
  aclPermission: AclPermission,
  apps: App[],
  knownApps: KnownApps,
  knownRoles: KnownRoles
): AclPermissionFormatted => {
  const {
    to: toAddress,
    role: roleHash,
    allowedEntities,
    manager: managerAddress,
  } = aclPermission

  /**
   * Shortcut to TRY get an app name from it's proxy address
   * If the app can't be found, returns an empty string: ''
   * @param address Proxy address of a possible app
   * @return app info
   */
  const getAppInfo = (address: string): AclPermissionAppInfo => {
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
 * @param permissions Permissions
 * @param apps Apps
 * @param knownApps Known apps
 * @param knownRoles Known roles
 * @return Formated acl permissions data
 */
export function formatAclPermissions(
  permissions: AclPermissions,
  apps: App[],
  knownApps: KnownApps,
  knownRoles: KnownRoles
): AclPermissionFormatted[] {
  return flattenAclPermissions(permissions).map(aclPermission =>
    formatAclPermission(aclPermission, apps, knownApps, knownRoles)
  )
}
