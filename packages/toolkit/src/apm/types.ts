import { AragonManifest, AragonArtifact } from '../types'
import { ethers } from 'ethers'

export interface AragonJsIntent {
  dao: string
  proxyAddress: string
  methodName: string
  params: string[]
  targetContract: string
}

interface ApmRepoVersion {
  version: string
  contract: string
  contentHash: string
}

/**
 * Parsed APM version info
 */
export interface ApmVersion {
  version: string
  contractAddress: string
  contentUri: string
}

/**
 * Raw APM version returned by the contract
 */
export interface ApmVersionReturn {
  semanticVersion: number[] // uint16[3]
  contractAddress: string // address
  contentURI: string // bytes
}

/**
 * Typed contract instance for APM Repo
 * ### TODO: Migrate to a better system such as Typechain
 */
export interface ApmRepoInstance extends ethers.Contract {
  getByVersionId: (versionId: number) => Promise<ApmVersionReturn>
  getLatest: () => Promise<ApmVersionReturn>
  getBySemanticVersion: (
    version: [number, number, number]
  ) => Promise<ApmVersionReturn>
}

/**
 * Complex type used in the current apm.js API
 * ### TODO: Simplify return types
 */
export interface AragonApmRepoData
  extends ApmVersion,
    AragonArtifact,
    AragonManifest {}
