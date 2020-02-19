import fs from 'fs'
import path from 'path'
import { AbiItem } from 'web3-utils'

interface ContractArtifacts {
  abi: AbiItem[]
}

/**
 * Reads artifacts of a solidity contract given its name or path
 * @param contract "Counter" | "contracts/Counter.sol"
 * @param options
 */
export default function readArtifacts(
  contract: string,
  options?: {
    rootPath?: string
    artifactsDir?: string
  }
): AbiItem[] {
  const rootPath = (options || {}).rootPath || '.'
  const artifactsDir = (options || {}).artifactsDir || 'artifacts'
  const contractName = path.parse(contract).name
  const artifactsPath = path.join(
    rootPath,
    artifactsDir,
    contractName + '.json'
  )

  const artifacts: ContractArtifacts = JSON.parse(
    fs.readFileSync(artifactsPath, 'utf8')
  )

  return artifacts.abi
}
