const ENS = require('ethereum-ens')
const Web3 = require('web3')
const registrarAbi = require('@aragon/id/abi/IFIFSResolvingRegistrar').abi

/**
 * Assign an Aragon Id to a DAO
 *
 * @param {Object} options Options
 * @param {string} options.id Aragon Id
 * @param {string} options.orgAddress DAO address
 * @param {string} options.ensRegistryAddress ENS registry address
 * @param {string} options.gasPrice Transaction gas price
 * @param {Object} options.web3 web3
 * @returns {Object} Transaction receipt
 */
async function assignId(options) {
  const { gasPrice, id, orgAddress, ensRegistryAddress, web3 } = options

  const ens = new ENS(web3.currentProvider, ensRegistryAddress)

  // Check name doesn't already exist
  try {
    const exists = await ens.resolver(`${id}.aragonid.eth`).addr()
    if (exists) {
      throw new Error(
        `Cannot assign: ${id}.aragonid.eth is already assigned to ${exists}.`
      )
    }
  } catch (err) {
    // ens.resolver() throws an ENS.NameNotFound error if name doesn't exist
    if (err !== ENS.NameNotFound) throw err
  }

  const registrar = new web3.eth.Contract(
    registrarAbi,
    await ens.owner(`aragonid.eth`)
  )

  const accounts = await web3.eth.getAccounts()
  return registrar.methods.register(Web3.utils.sha3(id), orgAddress).send({
    from: accounts[0],
    gas: '1000000',
    gasPrice: gasPrice || Web3.utils.toWei('10', 'gwei'),
  })
}

module.exports = assignId
