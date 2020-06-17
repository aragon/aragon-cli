import path from 'path'
import findUp from 'find-up'
import { AbiItem } from 'web3-utils'

interface ContractArtifacts {
  contractName: string
  abi: AbiItem[]
  bytecode: string
  deployedBytecode: string
}

/**
 * Finds an arapp.json or truffle config file path moving directories recursively up
 * @param {boolean} noThrow Whether to throw or not if the root path isn't found
 */
export function findProjectRoot(noThrow = false): string {
  const rootPath =
    findUp.sync('arapp.json') ||
    findUp.sync('truffle-config.js') ||
    findUp.sync('truffle.js')
  if (!rootPath && !noThrow) throw new Error('Cannot find root directory.')
  return rootPath ? path.dirname(rootPath) : ''
}

/**
 * Gets a contract path given its name
 * @param pkg
 * @param contractName
 */
export function getContract(
  pkg: string,
  contractName: string
): ContractArtifacts {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const artifact = require(`${pkg}/build/contracts/${contractName}.json`)
  return artifact
}

export function getIpfsCacheFiles(): any {
  return path.resolve(
    require.resolve('@aragon/aragen-snapshot'),
    '../ipfs-cache'
  )
}

export function getAragonGanacheFiles(): any {
  return path.resolve(
    require.resolve('@aragon/aragen-snapshot'),
    '../aragon-ganache'
  )
}
