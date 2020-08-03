import { sha3, isAddress } from 'web3-utils'
import { convertDAOIdToSubdomain } from '../utils/aragonId'
import { useEnvironment } from '../useEnvironment'
import { REGISTRAR_GAS_LIMIT, ARAGON_DOMAIN } from '../constants'
import { ififsResolvingRegistrarAbi } from '../contractAbis'

/**
 * Assign an id to an existing DAO address.
 *
 * @param daoAddress DAO proxy address
 * @param daoId Id to assign
 * @param environment Environment
 * @returns
 */
export async function assignDaoId(
  daoAddress: string,
  daoId: string,
  environment: string
): Promise<void> {
  const { web3, apmOptions, gasPrice } = useEnvironment(environment)

  if (!isAddress(daoAddress)) throw new Error(`Invalid address: ${daoAddress}`)
  const ens = new ENS(web3.currentProvider, apmOptions.ensRegistryAddress)

  const registrar = new web3.eth.Contract(
    ififsResolvingRegistrarAbi,
    await ens.owner(ARAGON_DOMAIN)
  )

  await registrar.methods.register(sha3(daoId), daoAddress).send({
    from: (await web3.eth.getAccounts())[0],
    gas: REGISTRAR_GAS_LIMIT,
    gasPrice,
  })
}

/**
 * Return true if `id` is assigned to an organization
 *
 * @param daoId Aragon DAO id
 * @param environment Environment
 * @returns true if already assigned
 */
export async function isDaoIdAssigned(
  daoId: string,
  environment: string
): Promise<boolean> {
  const { web3, apmOptions } = useEnvironment(environment)

  const daoUrl = convertDAOIdToSubdomain(daoId)
  const ens = new ENS(web3.currentProvider, apmOptions.ensRegistryAddress)

  // The only way to know if a domain is not registered is to call
  // `resolver().addr()` and check if it throws
  try {
    return Boolean(await ens.resolver(daoUrl).addr())
  } catch (err) {
    // throws an ENS.NameNotFound error if name doesn't exist
    if (err !== ENS.NameNotFound) throw err
    return false
  }
}
