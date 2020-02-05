/**
 * @typedef {Object} PermissionsData
 * @property {string[]} allowedEntities
 * @property {string} manager
 *
 * ACL structure sample: {
 *   [toAppAddress]: {
 *     [roleHash]: PermissionsData
 *   }
 * }
 * @typedef {Object.<string, PermissionsData>} PermissionsByTo
 * @typedef {Object.<string, PermissionsByTo>} AclPermissions
 */

/**
 * @typedef {Object} AclPermission
 * @property {string} to
 *           App address
 *           '0xbc4d08eb94caf68faf73be40780b68b1de369d15'
 * @property {string} role
 *           Role hash
 *           '0x0b719b33c83b8e5d300c521cb8b54ae9bd933996a14bef8c2f4e0285d2d2400a'
 * @property {string[]} allowedEntities
 *           [ '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7' ]
 * @property {string} manager
 *           '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
 */

/**
 * App object from ctx.apps items
 * @typedef {Object} App
 * @property {any[]} abi
 * @property {string} name
 *           'Kernel'
 * @property {string} appName
 *           'kernel.aragonpm.eth'
 * @property {any[]} roles
 * @property {any[]} functions
 * @property {boolean} isAragonOsInternalApp
 * @property {string} proxyAddress
 *           '0x76804359E7b668845D209f4a0391D5482a18C476'
 * @property {string} appId
 * @property {string} codeAddress
 * @property {boolean} isForwarder
 */

/**
 * Map of appIds to app ENS names
 * { '0x9fa3927f639745e587912d4b0fea7ef9013bf93fb907d29faeab57417ba6e1d4': 'voting.aragonpm.eth' }
 * @typedef {Object.<string, string>} KnownApps
 */

/**
 * Map of known roleHashes to role data
 * @typedef {Object.<string, KnownRole>} KnownRoles
 *
 * Item of KnownRoles
 * @typedef {Object} KnownRole
 * @property {string} name
 * @property {string} id
 */

/**
 * Descriptive metadata for an app in the context of an ACL permission
 * @typedef {Object} AclPermissionAppInfo
 * @property {string} address
 * @property {string} name
 */

/**
 * ACL permission data with parsed human names for display
 * @typedef {Object} AclPermissionFormatted
 * @property {AclPermissionAppInfo} to
 * @property {AclPermissionAppInfo} manager
 * @property {AclPermissionAppInfo[]} allowedEntities
 * @property {Object} role
 * @property {string} role.hash
 * @property {string} role.id
 */
