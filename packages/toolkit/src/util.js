import {
  ARAGON_DOMAIN,
  DEFAULT_GAS_FUZZ_FACTOR,
  LAST_BLOCK_GAS_LIMIT_FACTOR,
} from './helpers/constants'

/**
 * Check eth address equality without checksums
 * @param {string} first address
 * @param {string} second address
 * @returns {boolean} address equality
 */
export function addressesEqual(first, second) {
  first = first && first.toLowerCase()
  second = second && second.toLowerCase()
  return first === second
}

export const isAddress = addr => /0x[a-fA-F0-9]{40}/.test(addr)

/**
 * Validates an Aragon Id
 * @param {string} aragonId Aragon Id
 * @returns {boolean} `true` if valid
 */
export function isValidAragonId(aragonId) {
  return /^[a-z0-9-]+$/.test(aragonId)
}

/**
 * Convert a DAO id to its subdomain
 * E.g. mydao -> mydao.aragonid.eth
 * @param {string} aragonId Aragon Id
 * @returns {string} DAO subdomain
 */
export function convertDAOIdToSubdomain(aragonId) {
  // If already a subdomain, return
  if (new RegExp(`^([a-z0-9-]+).${ARAGON_DOMAIN}$`).test(aragonId))
    return aragonId

  if (!isValidAragonId(aragonId)) throw new Error(`Invalid DAO Id: ${aragonId}`)

  return `${aragonId}.${ARAGON_DOMAIN}`
}

export const expandLink = link => {
  const { name, address } = link
  const placeholder = `__${name}${'_'.repeat(38 - name.length)}`
  link.placeholder = placeholder
  link.regex = new RegExp(placeholder, 'g')
  link.addressBytes = address.slice(0, 2) === '0x' ? address.slice(2) : address
  return link
}

/**
 *
 * Calculate the recommended gas limit
 *
 * @param {*} web3 eth provider to get the last block gas limit
 * @param {number} estimatedGas estimated gas
 * @param {number} gasFuzzFactor defaults to 1.5
 * @returns {number} gasLimit
 */
export const getRecommendedGasLimit = async (
  web3,
  estimatedGas,
  gasFuzzFactor = DEFAULT_GAS_FUZZ_FACTOR
) => {
  // TODO print these values if --debug is passed
  const latestBlock = await web3.eth.getBlock('latest')
  const blockGasLimit = latestBlock.gasLimit

  const upperGasLimit = Math.round(blockGasLimit * LAST_BLOCK_GAS_LIMIT_FACTOR)
  if (estimatedGas > upperGasLimit) return estimatedGas // TODO print a warning?

  const bufferedGasLimit = Math.round(estimatedGas * gasFuzzFactor)

  if (bufferedGasLimit < upperGasLimit) return bufferedGasLimit
  return upperGasLimit
}

export const getContract = (pkg, contract) => {
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}
