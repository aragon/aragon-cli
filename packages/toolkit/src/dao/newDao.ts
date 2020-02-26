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
export default async function newDao(
  templateName = 'bare-template',
  newInstanceArgs: string[] = [],
  newInstanceMethod = 'newInstance',
  deployEvent = 'DeployDao',
  templateVersion = 'latest',
  environment: string,
  templateInstance: any // TODO: optional object options
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

  const estimatedGas = 7543829 // await newInstanceTx.estimateGas()
  const { events } = await newInstanceTx.send({
    from: (await web3.eth.getAccounts())[0],
    gas: await getRecommendedGasLimit(web3, estimatedGas),
    gasPrice,
  })

  if (!events[deployEvent])
    throw new Error(`Could not find deploy event: ${deployEvent}`)

  return events[deployEvent].returnValues.dao
}
