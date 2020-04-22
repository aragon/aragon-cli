import { getRecommendedGasLimit } from './utils/getRecommendedGasLimit'
import { getApmRepo } from '../apm'
import { useEnvironment } from '../helpers/useEnvironment'
import { bareTemplateAbi } from '../contractAbis'

/**
 * Create a new DAO
 *
 * @param templateName Template repo name
 * @param templateVersion Version of the template
 * @param newInstanceMethod New instance method name
 * @param newInstanceArgs New instance arguments
 * @param deployEvent Template deploy event
 * @param environment Environment
 * @param templateInstance Template instance
 */
export async function newDao(
  templateName = 'bare-template',
  {
    environment = 'local',
    newInstanceArgs = [],
    newInstanceMethod = 'newInstance',
    deployEvent = 'DeployDao',
    templateVersion = 'latest',
    templateInstance,
  }: {
    environment: string
    newInstanceArgs?: string[]
    newInstanceMethod?: string
    deployEvent?: string
    templateVersion?: string
    templateInstance?: any
  }
): Promise<string> {
  const { web3, gasPrice } = useEnvironment(environment)

  let template

  if (!templateInstance) {
    template = await getApmRepo(templateName, templateVersion, environment)

    // If not connected to IPFS, repo won't have an ABI
    const templateAbi = template.abi || bareTemplateAbi
    template = new web3.eth.Contract(templateAbi, template.contractAddress)
  } else {
    template = templateInstance
  }

  if (!template.methods[newInstanceMethod]) {
    throw new Error(
      `Template abi does not contain the requested function: ${newInstanceMethod}(...). This may be due to the template's abi not being retrieved from IPFS. Is IPFS running?`
    )
  }

  const newInstanceTx = template.methods[newInstanceMethod](...newInstanceArgs)

  const accounts = await web3.eth.getAccounts()
  const wallet = await web3.eth.accounts.wallet

  const estimatedGas = await newInstanceTx.estimateGas()
  const gas = await getRecommendedGasLimit(web3, estimatedGas)
  const { events } = await newInstanceTx.send({
    from: accounts[0] || wallet[0].address,
    gas,
    gasPrice,
  })

  if (!events[deployEvent])
    throw new Error(`Could not find deploy event: ${deployEvent}`)

  return events[deployEvent].returnValues.dao
}
