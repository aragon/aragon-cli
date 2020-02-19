import { getContract } from '../../util'
import { getRecommendedGasLimit } from './getRecommendedGasLimit'
import { useEnvironment } from '../../helpers/useEnvironment'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 *
 * Progress callback will be invoked with the following integers:
 * (1) - Estimating gas
 * (2, gas) - Estimated gas
 * (3) - Waiting for the tx to be mined
 *
 * @param {*} senderAccount todo
 * @param {*} progressHandler todo
 * @param  {string} environment Envrionment
 * @returns {*} todo
 */
export const deployMiniMeTokenFactory = async (
  senderAccount,
  progressHandler = () => {},
  environment
) => {
  return deployContract(
    senderAccount,
    '@aragon/apps-shared-minime',
    'MiniMeTokenFactory',
    [],
    progressHandler,
    environment
  )
}

/**
 *
 * Progress callback will be invoked with the following integers:
 * (1) - Estimating gas
 * (2, gas) - Estimated gas
 * (3) - Waiting for the tx to be mined
 *
 * @param {*} senderAccount todo
 * @param {*} tokenName todo
 * @param {*} decimalUnits todo
 * @param {*} symbol todo
 * @param {*} transferEnabled todo
 * @param {*} factoryAddress todo
 * @param {*} progressHandler todo
 * @param  {string} environment Envrionment
 * @returns {*} todo
 */
export const deployMiniMeToken = async (
  senderAccount,
  tokenName,
  decimalUnits,
  symbol,
  transferEnabled,
  factoryAddress,
  progressHandler = () => {},
  environment
) => {
  return deployContract(
    senderAccount,
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
    progressHandler,
    environment
  )
}

export const deployContract = async (
  senderAccount,
  artifactPackage,
  artifactName,
  contractArgs,
  progressHandler = () => {},
  environment
) => {
  const { web3, gasPrice } = useEnvironment(environment)

  const artifact = getContract(artifactPackage, artifactName)
  const contract = new web3.eth.Contract(artifact.abi)

  const transaction = contract.deploy({
    data: artifact.bytecode,
    arguments: contractArgs,
  })

  progressHandler(1)
  const estimatedGas = await transaction.estimateGas()
  progressHandler(2, estimatedGas)

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

  progressHandler(3)
  await sendPromise

  return result
}

/**
 * Change the controller of a MiniMe token
 *
 * @param {Object} web3 Web3
 * @param {string} tokenAddress MiniMe token address
 * @param {string} newController Controller address
 * @param {string} gasPrice Gas price
 * @returns {Promise<Object>} Transaction receipt
 */
export const changeController = async (
  tokenAddress,
  newController,
  environment
) => {
  const { web3, gasPrice } = useEnvironment(environment)

  const tokenAbi = getContract('@aragon/apps-shared-minime', 'MiniMeToken').abi

  const contract = new web3.eth.Contract(tokenAbi, tokenAddress)
  const from = (await web3.eth.getAccounts())[0]
  const tx = contract.methods.changeController(newController)
  const gas = await getRecommendedGasLimit(web3, await tx.estimateGas({ from }))

  return tx.send({ from, gas, gasPrice })
}
