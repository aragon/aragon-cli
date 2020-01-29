import web3Utils from 'web3-utils'
import { ensResolve } from '@aragon/wrapper'
//
import { useEnvironment } from '../../helpers/useEnvironment'

/**
 * Returns aclAddress for a DAO
 *
 * @param {string} dao DAO address or ENS domain
 * @param  {string} environment Envrionment
 * @return {Promise<string>} aclAddress
 */
export async function resolveAddressOrEnsDomain(dao, environment) {
  return web3Utils.isAddress(dao) ? dao : resolveEnsDomain(dao, environment)
}

/**
 * Resolve an ens domain
 *
 * @param {string} domain ENS domain
 * @param {string} environment Environment
 * @returns {Promise<string>} Resolved ens domain
 */
export async function resolveEnsDomain(domain, environment) {
  // TODO: Move to use ethereum-ens and internally
  try {
    const { web3, apmOptions } = useEnvironment(environment)

    return await ensResolve(domain, {
      provider: web3.currentProvider,
      registryAddress: apmOptions.ensRegistryAddress,
    })
  } catch (err) {
    if (err.message === 'ENS name not defined.') {
      return ''
    }
    throw err
  }
}

// TODO: Use logic of aragonPM ensResolve insteads
