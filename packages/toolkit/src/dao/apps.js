import { abi as kernelAbi } from '@aragon/os/build/contracts/Kernel'
//
import {
  initAragonJS,
  getApps,
  resolveEnsDomain,
} from '../helpers/aragonjs-wrapper'

/**
 * Return installed apps for a DAO
 *
 * @param {string} dao DAO address
 * @param {Object} options Options
 * @param {Object} options.provider ETH provider
 * @param {string} options.registryAddress ENS registry address
 * @param {Object} options.ipfs IPFS configuration
 * @param {Object[]} options.userApps User apps
 */
export async function getInstalledApps(dao, options) {
  const wrapper = await initAragonJS(dao, options.registryAddress, {
    ipfsConf: options.ipfs,
    provider: options.provider,
  })

  return getApps(wrapper)
}

/**
 * Return all apps in a DAO, including permissionless ones
 *
 * @param {string} DAO address
 * @param {Object} options Options
 * @param {Object} options.web3 Web3
 * @param {Object[]} options.userApps User apps
 */
export async function getAllApps(dao, options) {
  const { web3 } = options
  const kernel = new web3.eth.Contract(kernelAbi, dao)

  const events = await kernel.getPastEvents('NewAppProxy', {
    fromBlock: await kernel.methods.getInitializationBlock().call(),
    toBlock: 'latest',
  })

  return events.map(event => ({
    proxyAddress: event.returnValues.proxy,
    appId: event.returnValues.appId,
  }))
}

/**
 * Return a DAO address from its subdomain
 *
 * @param {string} dao DAO subdomain
 * @param {Object} options Options
 * @param {Object} options.provider ETH provider
 * @param {string} options.registryAddress ENS registry address
 */
export async function getDaoAddress(dao, options) {
  return /[a-z0-9]+\.eth/.test(dao) ? resolveEnsDomain(dao, options) : dao
}
