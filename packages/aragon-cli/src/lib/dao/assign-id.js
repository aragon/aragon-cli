const { convertDAOIdToUrl, ARAGON_DOMAIN } = require('../../util')
const ENS = require('ethereum-ens')
const ififsResolvingRegistrarAbi = require('@aragon/id/build/contracts/IFIFSResolvingRegistrar')
  .abi
const { sha3, isAddress } = require('web3').utils
const REGISTRAR_GAS_LIMIT = '1000000'

/**
 * Assign an id to an existing DAO address.
 *
 * @param {string} daoAddress DAO proxy address
 * @param {string} daoId Id to assign
 * @param {Object} options Options
 * @param {Object} options.web3 Web3
 * @param {string} options.ensRegistry ENS registry address
 * @param {string} options.gasPrice Gas price
 * @returns {void}
 */
async function assignId(daoAddress, daoId, options) {
  const { web3, ensRegistry, gasPrice } = options

  if (!isAddress(daoAddress)) throw new Error(`Invalid address: ${daoAddress}`)

  const ens = new ENS(web3.currentProvider, ensRegistry)

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
 * @param {Object} options Options
 * @param {Object} options.web3 web3
 * @param {string} options.ensRegistry ENS registry address
 * @returns {Promise<boolean>} true if already assigned
 */
async function isIdAssigned(daoId, options) {
  const daoUrl = convertDAOIdToUrl(daoId)
  const ens = new ENS(options.web3.currentProvider, options.ensRegistry)

  try {
    return Boolean(await ens.resolver(daoUrl).addr())
  } catch (err) {
    // ens.resolver() throws an ENS.NameNotFound error if name doesn't exist
    if (err !== ENS.NameNotFound) throw err
    return false
  }
}

module.exports = { isIdAssigned, assignId }
