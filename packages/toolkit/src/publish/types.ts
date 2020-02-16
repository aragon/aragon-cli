import { AbiItem } from 'web3-utils'

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

export interface AragonArtifact extends AragonAppJson {
  roles: RoleWithBytes[]
  functions: {
    roles: string[]
    notice: string
    abi: AbiItem
  }[]

  abi: AbiItem[]
  // ### TODO: Review if are necessary
  path: string // 'contracts/Finance.sol'
  appName: string // 'finance.aragonpm.eth'
  env: {
    registry: string // '0x314159265dd8dbb310642f98f50c066173c1259b'
    appName: string // 'finance.aragonpm.eth'
    network: string // 'mainnet'
  }
  appId: string // '0xbf8491150dafc5dcaee5b861414dca922de09ccffa344964ae167212e8c673ae'
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

interface AragonEnvironment {
  network: string
  appName: string
  registry: string
  // ### Todo: Are wsRPC and appId necessary
  wsRPC?: string
  appId?: string
}
