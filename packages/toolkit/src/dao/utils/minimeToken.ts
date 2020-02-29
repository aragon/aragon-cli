import { getContract } from '../../util'
import { getRecommendedGasLimit } from './getRecommendedGasLimit'
import { useEnvironment } from '../../helpers/useEnvironment'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

type ProgressHandlerDeployContract = (
  progressId: number,
  estimatedGas?: number
) => void

export async function deployContract(
  senderAccount: string,
  artifactPackage: string,
  artifactName: string,
  contractArgs: any[],
  progressHandler: ProgressHandlerDeployContract | undefined,
  environment: string
): Promise<{ address?: string; txHash?: string }> {
  const { web3, gasPrice } = useEnvironment(environment)

  const artifact = getContract(artifactPackage, artifactName)
  const contract = new web3.eth.Contract(artifact.abi)

  const transaction = contract.deploy({
    data: artifact.bytecode,
    arguments: contractArgs,
  })

  if (progressHandler) progressHandler(1)
  const estimatedGas = await transaction.estimateGas()
  if (progressHandler) progressHandler(2, estimatedGas)

  const sendPromise = transaction.send({
    from: senderAccount,
    gas: await getRecommendedGasLimit(web3, estimatedGas),
    gasPrice,
  })

  const result: { address?: string; txHash?: string } = {}

  sendPromise.on('receipt', receipt => {
    result.address = receipt.contractAddress
  })
  sendPromise.on('transactionHash', transactionHash => {
    result.txHash = transactionHash
  })

  if (progressHandler) progressHandler(3)
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
 * @param {*} senderAccount todo
 * @param {*} progressHandler todo
 * @param  {string} environment Envrionment
 * @returns {*} todo
 */
export async function deployMiniMeTokenFactory(
  senderAccount: string,
  progressHandler: ProgressHandlerDeployContract | undefined,
  environment: string
): Promise<{ address?: string; txHash?: string }> {
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
 * @param senderAccount
 * @param tokenName
 * @param decimalUnits
 * @param symbol
 * @param transferEnabled
 * @param factoryAddress
 * @param progressHandler
 * @param environment Envrionment
 * @returns
 */
export async function deployMiniMeToken(
  senderAccount: string,
  tokenName: string,
  decimalUnits: number,
  symbol: string,
  transferEnabled: any,
  factoryAddress: string,
  progressHandler: ProgressHandlerDeployContract | undefined,
  environment: string
): Promise<{ address?: string; txHash?: string }> {
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

/**
 * Change the controller of a MiniMe token
 *
 * @param tokenAddress MiniMe token address
 * @param newController Controller address
 * @returns {Promise<Object>} Transaction receipt
 */
export async function changeController(
  tokenAddress: string,
  newController: string,
  environment: string
): Promise<any> {
  const { web3, gasPrice } = useEnvironment(environment)

  const tokenAbi = getContract('@aragon/apps-shared-minime', 'MiniMeToken').abi

  const contract = new web3.eth.Contract(tokenAbi, tokenAddress)
  const from = (await web3.eth.getAccounts())[0]
  const tx = contract.methods.changeController(newController)
  const gas = await getRecommendedGasLimit(web3, await tx.estimateGas({ from }))

  return tx.send({ from, gas, gasPrice })
}
