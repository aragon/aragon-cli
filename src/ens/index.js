const ENS = require('ethereum-ens')

// A map of known ENS registries
const registries = {
  1: '0x314159265dd8dbb310642f98f50c066173c1259b',
  3: '0x112234455c3a32fd11230c42e7bccd4a84e02010'
}

module.exports = {
  /**
   * Get the address of the ENS registry for a chain ID.
   *
   * @param  {number} chainId
   * @return {string}
   */
  chainRegistry (chainId) {
    return registries[chainId]
  },
  /**
   * Get the address of an ENS name.
   *
   * @param  {[type]} name                                    [description]
   * @param  {[type]} eth                                     [description]
   * @param  {[type]} [registryAddress=this.chainRegistry(1)] [description]
   * @return {[type]}                                         [description]
   */
  resolve (name, web3, registryAddress = this.chainRegistry(1)) {
    const ens = new ENS(web3, registryAddress)

    return ens.resolver(name).addr()
  }
}
