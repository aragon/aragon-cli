import { getRecommendedGasLimit } from '../util'
import getApmRepo from '../apm/getApmRepo'
import bareTemplateAbi from './utils/bare-template-abi'
import { useEnvironment } from '../helpers/useEnvironment'

/**
 * Create a new DAO
 *
 * @param {string} templateName Template repo name
 * @param {string} templateVersion Version of the template
 * @param {string} newInstanceMethod New instance method name
 * @param {string[]} newInstanceArgs New instance arguments
 * @param {string} deployEvent Template deploy event
 * @param {string} environment Environment
 * @param {Object} templateInstance Template instance
 */
export default async function newDao(
  templateName = 'bare-template',
  newInstanceArgs = [],
  newInstanceMethod = 'newInstance',
  deployEvent = 'DeployDao',
  templateVersion = 'latest',
  environment,
  templateInstance // TODO: optional object options
) {
  console.log('>>environment:', environment)
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

  console.log('>>template:', template)

  if (!template.methods[newInstanceMethod]) {
    throw new Error(
      `Template abi does not contain the requested function: ${newInstanceMethod}(...). This may be due to the template's abi not being retrieved from IPFS. Is IPFS running?`
    )
  }

  const newInstanceTx = template.methods[newInstanceMethod](...newInstanceArgs)

  console.log('>>newInstanceTx:', newInstanceTx)

  const estimatedGas = 7543829 // await newInstanceTx.estimateGas()
  console.log('>>estimateGas:', estimatedGas)
  const { events } = await newInstanceTx.send({
    from: (await web3.eth.getAccounts())[0],
    gas: await getRecommendedGasLimit(web3, estimatedGas),
    gasPrice,
  })

  if (!events[deployEvent])
    throw new Error(`Could not find deploy event: ${deployEvent}`)

  return events[deployEvent].returnValues.dao
}
