const { getRecommendedGasLimit } = require('../../util')

/**
 * Create a new DAO
 *
 * @param {Object} parmas Parameters
 * @param {Object} repo Template repository
 * @param {Object} web3 web3
 * @param {Object} templateInstance Template instance
 * @param {string} newInstanceMethod New instance method name
 * @param {string[]} newInstanceArgs New instance arguments
 * @param {string} gasPrice Gas price
 */
module.exports = async function({
  repo,
  web3,
  templateInstance,
  newInstanceMethod,
  newInstanceArgs,
  deployEvent,
  gasPrice,
}) {
  const template =
    templateInstance || new web3.eth.Contract(repo.abi, repo.contractAddress)

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
