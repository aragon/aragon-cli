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
  return deployContract(
    web3,
    senderAccount,
    gasPrice,
    '@aragon/apps-shared-minime',
    'MiniMeTokenFactory',
    [],
    progressCallback
  )
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
  return deployContract(
    web3,
    senderAccount,
    gasPrice,
    '@aragon/apps-shared-minime',
    'MiniMeToken',
    [
      factoryAddress,
      ZERO_ADDRESS,
      0,
      tokenName,
      decimalUnits,
      symbol,
      transferEnabled,
    ],
    progressCallback
  )
}

export const deployContract = async (
  web3,
  senderAccount,
  gasPrice,
  artifactPackage,
  artifactName,
  contractArgs,
  progressCallback
) => {
  const artifact = getContract(artifactPackage, artifactName)
  const contract = new web3.eth.Contract(artifact.abi)

  const transaction = contract.deploy({
    data: artifact.bytecode,
    arguments: contractArgs,
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
