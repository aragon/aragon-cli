import * as fs from 'fs'
import * as path from 'path'
import { AragonAppJson } from '~/src/types'

const arappPath = 'arapp.json'
const contractsPath = './contracts'

export function readArapp(): AragonAppJson {
  return JSON.parse(fs.readFileSync(arappPath, 'utf-8'))
}

/**
 * Returns main contract path
 * @return "./contracts/Counter.sol"
 */
export function getMainContractPath(): string {
  // Read the path from arapp.json.
  if (fs.existsSync(arappPath)) {
    const arapp: { path: string } = JSON.parse(
      fs.readFileSync(arappPath, 'utf-8')
    )

    return arapp.path
  }

  // Try to guess contract path.
  if (fs.existsSync(contractsPath)) {
    const contracts: string[] = fs.readdirSync(contractsPath)

    const candidates: string[] = contracts.filter(
      name => name.endsWith('.sol') || name !== 'Imports.sol'
    )

    if (candidates.length === 1) {
      return path.join(contractsPath, candidates[0])
    }
  }

  throw Error(`Unable to find main contract path.`)
}

/**
 * Returns main contract name
 * @return "Counter"
 */
export function getMainContractName(): string {
  const mainContractPath: string = getMainContractPath()
  return path.parse(mainContractPath).name
}
