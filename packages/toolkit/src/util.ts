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
 * Finds an arapp.json path moving directories recursively up
 */
export function findProjectRoot(): string {
  const arappPath = findUp.sync('arapp.json')
  if (!arappPath) throw new Error('This directory is not an Aragon project')
  return path.dirname(arappPath)
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
  return path.resolve(require.resolve('@aragon/aragen-snapshot'), '../ipfs-cache')
}

export function getAragonGanacheFiles(): any {
  return path.resolve(require.resolve('@aragon/aragen-snapshot'), '../aragon-ganache')
}
