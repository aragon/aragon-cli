import web3Utils from 'web3-utils'
import { resolveEnsDomain } from '../../helpers/aragonjs-wrapper'

/**
 * Returns aclAddress for a DAO
 *
 * @param {string} dao DAO address or ENS domain
 * @param {Object} web3 Web3 initialized object
 * @param {string} ensRegistryAddress ENS registry address
 * @return {Promise<string>} aclAddress
 */
export async function resolveAddressOrEnsDomain(dao, web3, registryAddress) {
  return web3Utils.isAddress(dao)
    ? dao
    : resolveEnsDomain(dao, {
        provider: web3.currentProvider,
        registryAddress,
      })
}
