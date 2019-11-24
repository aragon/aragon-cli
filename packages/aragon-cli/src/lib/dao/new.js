const { getRecommendedGasLimit } = require('../../util')

module.exports = async function({
  repo,
  web3,
  templateInstance,
  fn,
  fnArgs,
  deployEvent,
  gasPrice,
}) {
  const template =
    templateInstance || new web3.eth.Contract(repo.abi, repo.contractAddress)

  const newInstanceTx = template.methods[fn](...fnArgs)
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
