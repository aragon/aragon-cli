import {
  initAragonJS,
  getApps,
  resolveEnsDomain,
} from '../../helpers/aragonjs-wrapper'

/**
 * Return installed apps for a DAO
 *
 * @param {string} dao DAO address
 * @param {Object} options Options
 * @param {Object} options.provider ETH provider
 * @param {string} options.registryAddress ENS registry address
 * @param {string} options.ipfs IPFS configuration
 */
async function getInstalledApps(dao, options) {
  const wrapper = await initAragonJS(dao, options.registryAddress, {
    ipfsConf: options.ipfs,
    provider: options.provider,
  })

  return getApps(wrapper)
}

/**
 * Return a DAO address from its subdomain
 *
 * @param {string} dao DAO subdomain
 * @param {Object} options Options
 * @param {Object} options.provider ETH provider
 * @param {string} options.registryAddress ENS registry address
 */
async function getDaoAddress(dao, options) {
  return /[a-z0-9]+\.eth/.test(dao) ? resolveEnsDomain(dao, options) : dao
}

module.exports = { getDaoAddress, getInstalledApps }
