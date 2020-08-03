import { AbiItem } from 'web3-utils'

// The aragon manifest requires the use of camelcase for some names
/* eslint-disable camelcase */
export interface AragonManifest {
  name: string // 'Counter'
  author: string // 'Aragon Association'
  description: string // 'An application for Aragon'
  changelog_url: string // "https://github.com/aragon/aragon-apps/releases",
  details_url: string // '/meta/details.md'
  source_url: string // 'https://<placeholder-repository-url>'
  icons: {
    src: string // '/meta/icon.svg'
    sizes: string // '56x56'
  }[]
  screenshots: {
    src: string // '/meta/screenshot-1.png'
  }[]
  script: string // '/script.js'
  start_url: string // '/index.html'
}
/* eslint-enable camelcase */

export interface AragonArtifact extends AragonAppJson {
  roles: RoleWithBytes[]
  functions: {
    roles: string[]
    notice: string
    abi: AbiItem | undefined
  }[]
  environments: AragonEnvironments
  abi: AbiItem[]
  path: string // 'contracts/Finance.sol'
  // Additional metadata for accountability
  flattenedCode: string
}

export interface AragonAppJson {
  roles: Role[]
  environments: AragonEnvironments
  path: string
  dependencies?: {
    appName: string // 'vault.aragonpm.eth'
    version: string // '^4.0.0'
    initParam: string // '_vault'
    state: string // 'vault'
    requiredPermissions: {
      name: string // 'TRANSFER_ROLE'
      params: string // '*'
    }[]
  }[]
}

export interface Role {
  name: string // "Change period duration",
  id: string // "CHANGE_PERIOD_ROLE",
  params: string[] // [ "New period duration", "Old period duration"]
}

export interface RoleWithBytes extends Role {
  bytes: string //  '0xd35e458bacdd5343c2f050f574554b2f417a8ea38d6a9a65ce2225dbe8bb9a9d'
}

export interface AragonEnvironments {
  [environmentName: string]: AragonEnvironment
}

export interface AragonEnvironment {
  network: string
  registry: string
  appName?: string
  gasPrice?: string
  wsRPC?: string
  appId?: string
}

export interface AclPermissions {
  [toAppAddress: string]: {
    [roleHash: string]: {
      allowedEntities: string[]
      manager: string
    }
  }
}

export interface AclPermission {
  to: string // App address '0xbc4d08eb94caf68faf73be40780b68b1de369d15'
  role: string // Role hash '0x0b719b33c83b8e5d300c521cb8b54ae9bd933996a14bef8c2f4e0285d2d2400a'
  allowedEntities: string[] // [ '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7' ]
  manager: string // '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
}
