import { AbiItem } from 'web3-utils'

// JSON files are imported in this unique file until Typescript x JSON import issues are fixed
// Afterwards, keep this file since contract abi files may change and then it will only
// require modifying the imports in a single file

/* eslint-disable @typescript-eslint/no-var-requires */

// From @aragon/abis/os
export const kernelAbi: AbiItem[] = require('@aragon/abis/os/artifacts/Kernel')
  .abi
export const aclAbi: AbiItem[] = require('@aragon/abis/os/artifacts/ACL').abi
export const repoAbi: AbiItem[] = require('@aragon/abis/os/artifacts/Repo').abi
export const aragonAppAbi: AbiItem[] = require('@aragon/abis/os/artifacts/AragonApp')
  .abi

// From @aragon/abis/id
export const ififsResolvingRegistrarAbi: AbiItem[] = require('@aragon/abis/id/artifacts/IFIFSResolvingRegistrar')
  .abi

// From local JSON
export const bareTemplateAbi: AbiItem[] = require('./bareTemplateAbi.json')
