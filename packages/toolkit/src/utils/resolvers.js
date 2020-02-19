import { isAddress } from 'web3-utils'
import ENS from 'ethereum-ens'
//
import { useEnvironment } from '../helpers/useEnvironment'
import { convertDAOIdToSubdomain } from './aragonId'

/**
 * Return a DAO address from its subdomain
 *
 * @param {string} dao DAO address or ENS domain
 * @param  {string} environment Envrionment
 * @return {Promise<string>} aclAddress
 */
export async function resolveDaoAddressOrEnsDomain(dao, environment) {
  return isAddress(dao)
    ? dao
    : resolveEnsDomain(convertDAOIdToSubdomain(dao), environment)
}

/**
 * Resolve an ens domain
 *
 * @param {string} domain ENS domain
 * @param {string} environment Environment
 * @returns {Promise<string>} Resolved ens domain
 */
export async function resolveEnsDomain(domain, environment) {
  try {
    const { web3, apmOptions } = useEnvironment(environment)

    const ens = new ENS(web3.currentProvider, apmOptions.ensRegistryAddress)

    return ens.resolver(domain).addr()
  } catch (err) {
    if (err.message === 'ENS name not defined.') {
      return ''
    }
    throw err
  }
}
