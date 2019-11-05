import { getContract, getRecommendedGasLimit, ZERO_ADDRESS } from '../util'

/**
 *
 * Progress callback will be invoked with the following integers:
 * (1) - Estimating gas
 * (2, gas) - Estimated gas
 * (3) - Waiting for the tx to be mined
 *
 * @param {*} web3 todo
 * @param {*} senderAccount todo
 * @param {*} gasPrice todo
 * @param {*} progressCallback todo
 * @returns {*} todo
 */
export const deployMiniMeTokenFactory = async (
  web3,
  senderAccount,
  gasPrice,
  progressCallback
) => {
  const artifact = getContract(
    '@aragon/apps-shared-minime',
    'MiniMeTokenFactory'
  )
  const contract = new web3.eth.Contract(artifact.abi)
  const transaction = contract.deploy({ data: artifact.bytecode })

  progressCallback(1)
  const estimatedGas = await transaction.estimateGas()
  progressCallback(2, estimatedGas)

  const sendPromise = transaction.send({
    from: senderAccount,
    gas: await getRecommendedGasLimit(web3, estimatedGas),
    gasPrice,
  })

  const result = {}

  sendPromise.on('receipt', receipt => {
    result.address = receipt.contractAddress
  })
  sendPromise.on('transactionHash', transactionHash => {
    result.txHash = transactionHash
  })

  progressCallback(3)
  await sendPromise

  return result
}

/**
 *
 * Progress callback will be invoked with the following integers:
 * (1) - Estimating gas
 * (2, gas) - Estimated gas
 * (3) - Waiting for the tx to be mined
 *
 * @param {*} web3 todo
 * @param {*} senderAccount todo
 * @param {*} gasPrice todo
 * @param {*} tokenName todo
 * @param {*} decimalUnits todo
 * @param {*} symbol todo
 * @param {*} transferEnabled todo
 * @param {*} factoryAddress todo
 * @param {*} progressCallback todo
 * @returns {*} todo
 */
export const deployMiniMeToken = async (
  web3,
  senderAccount,
  gasPrice,
  tokenName,
  decimalUnits,
  symbol,
  transferEnabled,
  factoryAddress,
  progressCallback
) => {
  const artifact = getContract('@aragon/apps-shared-minime', 'MiniMeToken')
  const contract = new web3.eth.Contract(artifact.abi)

  const transaction = contract.deploy({
    data: artifact.bytecode,
    arguments: [
      factoryAddress,
      ZERO_ADDRESS,
      0,
      tokenName,
      decimalUnits,
      symbol,
      transferEnabled,
    ],
  })

  progressCallback(1)
  const estimatedGas = await transaction.estimateGas()
  progressCallback(2, estimatedGas)

  const sendPromise = transaction.send({
    from: senderAccount,
    gas: await getRecommendedGasLimit(web3, estimatedGas),
    gasPrice,
  })

  const result = {}

  sendPromise.on('receipt', receipt => {
    result.address = receipt.contractAddress
  })
  sendPromise.on('transactionHash', transactionHash => {
    result.txHash = transactionHash
  })

  progressCallback(3)
  await sendPromise

  return result
}
