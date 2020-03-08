import { AbiItem } from 'web3-utils'
import web3EthAbiUntyped, { AbiCoder } from 'web3-eth-abi'
import * as abiAragonAppProxy from '@aragon/abis/os/abi/AppProxyBase.json'
import {
  parseGlobalVariableAssignments,
  parseConstructorAssignments,
} from './parseContractFunctions'

// Fix necessary due to wrong type exports in web3-eth-abi
const web3EthAbi: AbiCoder = web3EthAbiUntyped as any

function findFunctionSignatureCollisions(abi1: AbiItem[], abi2: AbiItem[]) {
  const getFunctionSignatures = (abi: AbiItem[]) => {
    const signatures = []
    for (const entity of abi) {
      if (!(entity.type === 'function')) continue
      signatures.push({
        name: entity.name,
        signature: web3EthAbi.encodeFunctionSignature(entity),
      })
    }
    return signatures
  }

  const signatures1 = getFunctionSignatures(abi1)
  const signatures2 = getFunctionSignatures(abi2)

  const collisions = signatures1.filter(item1 => {
    if (signatures2.some(item2 => item2.signature === item1.signature))
      return true
    return false
  })

  return collisions
}

function checkAssignedGlobalVariables(sourceCode: string) {
  const assignments = parseGlobalVariableAssignments(sourceCode)
  const assignments2 = parseConstructorAssignments(sourceCode)
  if (assignments.length > 0 || assignments2.length > 0) {
    console.log(
      `WARNING: Global state variables found to be initialized with values
        during contract creation. This will probably lead to unintended results.
        App contracts should use the initialize() function to initialize global
        variables. Affected variables:`,
      JSON.stringify(assignments.concat(assignments2))
    )
  }
}

function checkSignatureCollisionsWithProxy(abi: AbiItem[]) {
  const appProxyAbi = (abiAragonAppProxy.abi as AbiItem[]).filter(
    ({ type }) => type === 'function'
  )
  const collisions = findFunctionSignatureCollisions(abi, appProxyAbi)
  if (collisions.length > 0) {
    console.log(
      `WARNING: Collisions detected between the proxy and app contract ABI's.
        This is a potential security risk.
        Affected functions:`,
      JSON.stringify(collisions.map(entry => entry.name))
    )
  }
}

export function validateApp(abi: AbiItem[], sourceCode: string) {
  checkSignatureCollisionsWithProxy(abi)
  checkAssignedGlobalVariables(sourceCode)
}
