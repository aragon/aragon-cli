import {
  initAragonJS,
  getTransactionPath,
} from '../../helpers/aragonjs-wrapper'
const { startIPFSDaemon, isDaemonRunning } = require('../ipfs/daemon')
const DEFAULT_IPFS = {
  protocol: 'http',
  host: '127.0.0.1',
  port: 5001,
}

/**
 * Execute a method on a DAO's app.
 *
 * @param {Object} params Parameters
 * @param {string} params.dao DAO name or address
 * @param {string} params.app App address
 * @param {string} params.method Method name
 * @param {Array<*>} params.params Method parameters
 * @param {boolean} params.ipfsCheck Check if IPFS is running
 * @param {Object} params.apm APM config
 * @param {Object} params.web3 Web3 instance
 * @param {string} params.gasPrice Gas price
 * @param {function} params.progressHandler Progress handler
 * @returns {Promise<{ transactionPath, receipt }>} Transaction path and receipt
 */
module.exports = async ({
  dao,
  app,
  method,
  params,
  apm,
  web3,
  gasPrice,
  ipfsCheck,
  progressHandler = () => {},
}) => {
  if (ipfsCheck && !(await isDaemonRunning(DEFAULT_IPFS)))
    await startIPFSDaemon()

  const wrapper = await initAragonJS(dao, apm['ens-registry'], {
    ipfsConf: apm.ipfs,
    gasPrice,
    provider: web3.currentProvider,
    accounts: await web3.eth.getAccounts(),
  })

  progressHandler(1)

  const transactionPath = (await getTransactionPath(
    app,
    method,
    params,
    wrapper
  ))[0]

  if (!transactionPath)
    throw new Error('Cannot find transaction path for executing action')

  progressHandler(2)

  return {
    transactionPath,
    receipt: await web3.eth.sendTransaction(transactionPath),
  }
}
