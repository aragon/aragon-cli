const { convertDAOIdToUrl } = require('../../util')
const ENS = require('ethereum-ens')

async function assignId(daoAddress, id) {


}

/**
 * Returns true if `id` is assigned to an organization
 * @param {string} daoId Aragon DAO id
 * @param {Object} options Options
 * @param {Object} options.ethProvider Ethereum provider
 * @param {string} options.ensRegistry ENS registry address
 * @returns {Promise<boolean>}
 */
async function isIdAssigned(daoId, options) {
    const daoUrl = convertDAOIdToUrl(daoId)
    const ens = new ENS(
        web3.currentProvider,
        apmOptions['ens-registry']
    )

    try {
        return Boolean(await ens.resolver(daoUrl).addr())        
    } catch (err) {
        // ens.resolver() throws an ENS.NameNotFound error if name doesn't exist
        if (err !== ENS.NameNotFound) throw err
    }
}