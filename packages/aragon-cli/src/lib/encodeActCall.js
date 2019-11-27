const web3 = require('web3')

/**
 * Encode ACT function call
 * @param {string} signature Function signature
 * @param {any[]} params
 */
module.exports = (signature, params) => {
  const sigBytes = web3.eth.abi.encodeFunctionSignature(signature)

  const types = signature.replace(')', '').split('(')[1]

  // No params, return signature directly
  if (types === '') {
    return sigBytes
  }

  const paramBytes = web3.eth.abi.encodeParameters(types.split(','), params)

  return `${sigBytes}${paramBytes.slice(2)}`
}
