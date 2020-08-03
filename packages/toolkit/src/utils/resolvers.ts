import { isAddress } from 'web3-utils'
import { useEnvironment } from '../useEnvironment'
import { convertDAOIdToSubdomain } from './aragonId'

/**
 * Resolve an ens domain
 *
 * @param domain ENS domain
 * @param environment Environment
 * @returns Resolved ens domain
 */
export async function resolveEnsDomain(
  domain: string,
  environment: string
): Promise<string> {
  try {
    const { provider } = useEnvironment(environment)

    return provider.resolveName(domain)
  } catch (err) {
    if (err.message === 'ENS name not defined.') {
      return ''
    }
    throw err
  }
}

/**
 * Return a DAO address from its subdomain
 *
 * @param dao DAO address or ENS domain
 * @param environment Envrionment
 * @return aclAddress
 */
export async function resolveDaoAddressOrEnsDomain(
  dao: string,
  environment: string
): Promise<string> {
  return isAddress(dao)
    ? dao
    : resolveEnsDomain(convertDAOIdToSubdomain(dao), environment)
}
