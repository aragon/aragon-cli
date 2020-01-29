import { getRecommendedGasLimit } from '../util'
import getApm from '../apm/apm'
import bareTemplateAbi from './utils/bare-template-abi'
import defaultAPMName from '../helpers/default-apm'
import { configEnvironment } from '../helpers/configEnvironment'
import { LATEST_VERSION, DEFAULT_IPFS_TIMEOUT } from '../helpers/constants'

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
export default async function(
  environment,
  templateName = defaultAPMName('bare-template'),
  newInstanceArgs = [],
  newInstanceMethod = 'newInstance',
  deployEvent = 'DeployDao',
  templateVersion = 'latest',
  templateInstance
) {
  const { web3, gasPrice } = configEnvironment(environment)

  let template

  if (!templateInstance) {
    const apm = await getApm(environment)

    template =
      templateVersion === LATEST_VERSION
        ? await apm.getLatestVersion(templateName, DEFAULT_IPFS_TIMEOUT)
        : await apm.getVersion(
            templateName,
            templateVersion.split('.'),
            DEFAULT_IPFS_TIMEOUT
          )

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
  const estimatedGas = await newInstanceTx.estimateGas()
  const { events } = await newInstanceTx.send({
    from: (await web3.eth.getAccounts())[0],
    gas: await getRecommendedGasLimit(web3, estimatedGas),
    gasPrice,
  })

  if (!events[deployEvent])
    throw new Error(`Could not find deploy event: ${deployEvent}`)

  return events[deployEvent].returnValues.dao
}
