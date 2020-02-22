const DEFAULT_GAS_FUZZ_FACTOR = 1.5
const LAST_BLOCK_GAS_LIMIT_FACTOR = 0.95

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
  const latestBlock = await web3.eth.getBlock('latest')
  const blockGasLimit = latestBlock.gasLimit

  const upperGasLimit = Math.round(blockGasLimit * LAST_BLOCK_GAS_LIMIT_FACTOR)
  if (estimatedGas > upperGasLimit) return estimatedGas // TODO print a warning?

  const bufferedGasLimit = Math.round(estimatedGas * gasFuzzFactor)

  if (bufferedGasLimit < upperGasLimit) return bufferedGasLimit
  return upperGasLimit
}
