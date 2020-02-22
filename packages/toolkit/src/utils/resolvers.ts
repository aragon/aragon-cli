import { isAddress } from 'web3-utils'
import { useEnvironment } from '../helpers/useEnvironment'
import { convertDAOIdToSubdomain } from './aragonId'
// Note: Must use require because 'ethereum-ens' is an untyped library
// without type definitions or @types/ethereum-ens
/* eslint-disable @typescript-eslint/no-var-requires */
const ENS = require('ethereum-ens')

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
    : await resolveEnsDomain(convertDAOIdToSubdomain(dao), environment)
}

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
    const { web3, apmOptions } = useEnvironment(environment)

    const ens = new ENS(web3.currentProvider, apmOptions.ensRegistryAddress)

    return await ens.resolver(domain).addr()
  } catch (err) {
    if (err.message === 'ENS name not defined.') {
      return ''
    }
    throw err
  }
}
