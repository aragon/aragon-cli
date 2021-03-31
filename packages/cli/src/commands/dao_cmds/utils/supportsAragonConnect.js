/**
 * Returns true if the provided Ethereum network id supports
 * Aragon Connect. Currently `true` for mainnet and Rinkeby
 * @param {number} Ethereum network id
 */
export const supportsAragonConnect = (networkId) => {
  return networkId === 1 || networkId === 4
}
