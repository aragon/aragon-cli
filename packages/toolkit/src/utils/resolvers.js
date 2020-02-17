import { isAddress } from 'web3-utils'
import ENS from 'ethjs-ens'
//
import { useEnvironment } from '../helpers/useEnvironment'

/**
 * Returns aclAddress for a DAO
 *
 * @param {string} dao DAO address or ENS domain
 * @param  {string} environment Envrionment
 * @return {Promise<string>} aclAddress
 */
export async function resolveAddressOrEnsDomain(dao, environment) {
  return isAddress(dao) ? dao : resolveEnsDomain(dao, environment)
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

    return await resolveEns(domain, {
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

/**
 * Resolve an ens name or node
 *
 * @param {string} nameOrNode
 * @param {*} opts
 * @returns {Promise<string>}
 */
export function resolveEns(
  nameOrNode,
  opts = { provider: {}, registryAddress: {} }
) {
  const isName = nameOrNode.includes('.')

  // Stupid hack for ethjs-ens
  if (!opts.provider.sendAsync) {
    opts.provider.sendAsync = opts.provider.send
  }

  const ens = new ENS(opts)
  if (isName) {
    // debug(`Looking up ENS name ${nameOrNode}`)
    return ens.lookup(nameOrNode)
  }

  // debug(`Looking up ENS node ${nameOrNode}`)
  return ens.resolveAddressForNode(nameOrNode)
}
