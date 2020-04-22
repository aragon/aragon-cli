const DEFAULT_GAS_FUZZ_FACTOR = 1.5
const LAST_BLOCK_GAS_LIMIT_FACTOR = 0.95

/**
 *
 * Calculate the recommended gas limit
 *
 * @param web3 eth provider to get the last block gas limit
 * @param estimatedGas estimated gas
 * @param gasFuzzFactor defaults to 1.5
 * @returns gasLimit
 */
export async function getRecommendedGasLimit(
  ethereum: any,
  estimatedGas: number,
  gasFuzzFactor: number = DEFAULT_GAS_FUZZ_FACTOR
): Promise<number> {
  const latestBlock = await ethereum.eth.getBlock('latest')
  const blockGasLimit = latestBlock.gasLimit

  const upperGasLimit = Math.round(blockGasLimit * LAST_BLOCK_GAS_LIMIT_FACTOR)
  if (estimatedGas > upperGasLimit) return estimatedGas // TODO print a warning?

  const bufferedGasLimit = Math.round(estimatedGas * gasFuzzFactor)

  if (bufferedGasLimit < upperGasLimit) return bufferedGasLimit
  return upperGasLimit
}
