import path from 'path'
import findUp from 'find-up'

let cachedProjectRoot

export const findProjectRoot = () => {
  if (!cachedProjectRoot) {
    try {
      cachedProjectRoot = path.dirname(findUp.sync('arapp.json'))
    } catch (_) {
      throw new Error('This directory is not an Aragon project')
    }
  }
  return cachedProjectRoot
}

export const getContract = (pkg, contract) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}

export const getIpfsCacheFiles = () => {
  return path.resolve(require.resolve('@aragon/aragen'), '../ipfs-cache')
}

export const getAragonGanacheFiles = () => {
  return path.resolve(require.resolve('@aragon/aragen'), '../aragon-ganache')
}
