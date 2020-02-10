import { initAragonJS, getTransactionPath } from '../helpers/aragonjs-wrapper'

/**
 * Execute a method on a DAO's app.
 *
 * @param {Object} params Parameters
 * @param {string} params.dao DAO name or address
 * @param {string} params.app App address
 * @param {string} params.method Method name
 * @param {Array<*>} params.params Method parameters
 * @param {Object} params.apm APM config
 * @param {Object} params.web3 Web3 instance
 * @param {Object} params.wsProvider Ethereum provider
 * @param {string} params.gasPrice Gas price
 * @param {function} params.progressHandler Progress handler
 * @returns {Promise<{ transactionPath, receipt }>} Transaction path and receipt
 */
export default async function({
  dao,
  app,
  method,
  params,
  apm,
  web3,
  wsProvider,
  gasPrice,
  progressHandler = () => {},
}) {
  const wrapper = await initAragonJS(dao, apm.ensRegistryAddress, {
    ipfsConf: apm.ipfs,
    gasPrice,
    provider: wsProvider || web3.currentProvider,
    accounts: await web3.eth.getAccounts(),
  })

  progressHandler(1)

  const transactionPath = (
    await getTransactionPath(app, method, params, wrapper)
  )[0]

  if (!transactionPath)
    throw new Error('Cannot find transaction path for executing action')

  progressHandler(2)

  return {
    transactionPath,
    receipt: await web3.eth.sendTransaction(transactionPath),
  }
}
