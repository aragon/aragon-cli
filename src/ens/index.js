const ENS = require('ethereum-ens')

module.exports = {
  /**
   * Get the address of an ENS name.
   *
   * @param  {string} name
   * @param  {object} web3
   * @param  {string} [registryAddress=null]
   * @return {string}
   */
  resolve (name, web3, registryAddress = null) {
    const ens = new ENS(web3, registryAddress)

    return ens.resolver(name).addr()
  }
}
