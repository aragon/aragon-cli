export interface AclPermissions {
  [toAppAddress: string]: {
    [roleHash: string]: {
      allowedEntities: string[]
      manager: string
    }
  }
}

export interface AclPermission {
  to: string // App address: '0xbc4d08eb94caf68faf73be40780b68b1de369d15'
  role: string // Role hash: '0x0b719b33c83b8e5d300c521cb8b54ae9bd933996a14bef8c2f4e0285d2d2400a'
  allowedEntities: string[] // Array of addresses: ['0xb4124cEB3451635DAcedd11767f004d8a28c6eE7']
  manager: string // Manager address: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
}

/**
 * App object from ctx.apps items
 */
export interface App {
  proxyAddress: string // '0x76804359E7b668845D209f4a0391D5482a18C476'
  appId: string
  abi?: any[]
  name?: string // 'Kernel'
  appName?: string // 'kernel.aragonpm.eth'
  roles?: any[]
  functions?: any[]
  isAragonOsInternalApp?: boolean
  codeAddress?: string
  isForwarder?: boolean
}

/**
 * Map of appIds to app ENS names
 * { '0x9fa3927f639745e587912d4b0fea7ef9013bf93fb907d29faeab57417ba6e1d4': 'voting.aragonpm.eth' }
 */
export interface KnownApps {
  [appId: string]: string // 'voting.aragonpm.eth'
}

/**
 * Map of known roleHashes to role data
 */
export interface KnownRoles {
  [roleHash: string]: {
    name: string
    id: string
  }
}

/**
 * Descriptive metadata for an app in the context of an ACL permission
 */
export interface AclPermissionAppInfo {
  address: string
  name: string
}

/**
 * ACL permission data with parsed human names for display
 */
export interface AclPermissionFormatted {
  to: AclPermissionAppInfo
  manager: AclPermissionAppInfo
  allowedEntities: AclPermissionAppInfo[]
  role: {
    hash: string
    id: string
  }
}
