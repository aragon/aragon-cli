import path from 'path'
import findUp from 'find-up'

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
export function getContract(pkg: string, contractName: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const artifact = require(`${pkg}/build/contracts/${contractName}.json`)
  return artifact
}

export function getIpfsCacheFiles() {
  return path.resolve(require.resolve('@aragon/aragen'), '../ipfs-cache')
}

export function getAragonGanacheFiles() {
  return path.resolve(require.resolve('@aragon/aragen'), '../aragon-ganache')
}
