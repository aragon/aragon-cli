import ENS from 'ethereum-ens'
import { sha3, isAddress } from 'web3-utils'
import { abi as ififsResolvingRegistrarAbi } from '@aragon/abis/id/artifacts/IFIFSResolvingRegistrar'
//
import { convertDAOIdToSubdomain } from '../util'
import { configEnvironment } from '../../helpers/configEnvironment'
import { REGISTRAR_GAS_LIMIT, ARAGON_DOMAIN } from '../helpers/constants'

/**
 * Assign an id to an existing DAO address.
 *
 * @param {string} daoAddress DAO proxy address
 * @param {string} daoId Id to assign
 * @param {string} environment Environment
 * @returns {void}
 */
export async function assignId(daoAddress, daoId, environment) {
  const { web3, apmOptions, gasPrice } = configEnvironment(environment)

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
 * @param {string} daoId Aragon DAO id
 * @param {string} environment Environment
 * @returns {Promise<boolean>} true if already assigned
 */
export async function isIdAssigned(daoId, environment) {
  const { web3, apmOptions } = configEnvironment(environment)

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
