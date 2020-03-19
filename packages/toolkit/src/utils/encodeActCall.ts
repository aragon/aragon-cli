import web3EthAbiUntyped, { AbiCoder } from 'web3-eth-abi'

// Fix necessary due to wrong type exports in web3-eth-abi
const web3EthAbi: AbiCoder = web3EthAbiUntyped as any

/**
 * Encode ACT function call
 * @param signature Function signature
 * @param params
 */
export function encodeActCall(signature: string, params: any[] = []): string {
  const sigBytes = web3EthAbi.encodeFunctionSignature(signature)

  const types = signature.replace(')', '').split('(')[1]

  // No params, return signature directly
  if (types === '') {
    return sigBytes
  }

  const paramBytes = web3EthAbi.encodeParameters(types.split(','), params)

  return `${sigBytes}${paramBytes.slice(2)}`
}
