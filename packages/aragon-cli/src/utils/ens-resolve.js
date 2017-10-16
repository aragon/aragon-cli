const { hash } = require('eth-ens-namehash')
const consts = require('./constants')

const registries = {
  1: '0x314159265dd8dbb310642f98f50c066173c1259b',
  3: '0x112234455c3a32fd11230c42e7bccd4a84e02010'
}

module.exports.resolve = function (name, eth, chainId = 1) {
  const node = hash(name)

  return new eth.Contract(
    require('../../abi/ens/ENSRegistry.json'),
    registries[chainId]
  ).methods.resolver(node).call()
    .then((resolverAddress) =>
      resolverAddress === consts.NULL_ADDRESS
        ? resolverAddress
        : new eth.Contract(
          require('../../abi/ens/ENSResolver.json'),
          resolverAddress
        ).methods.addr(node).call()
    )
}
