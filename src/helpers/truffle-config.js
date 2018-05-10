const fs = require('fs')
const { findProjectRoot } = require('../util')

const getTruffleConfig = () => {
  try {
    if (fs.existsSync(`${findProjectRoot()}/truffle.js`)) {
      const truffleConfig = require(`${findProjectRoot()}/truffle.js`)
      // For some reason truffleConfig is injected a provider object. Remove it
      if (truffleConfig.networks && 
          truffleConfig.networks.development &&
          truffleConfig.networks.development.provider
      ) {
        truffleConfig.networks.development.provider = undefined
      }
      return truffleConfig
    } else {
      throw new Error(`Didn't found any truffle.js file`)
    }
  } catch (_) {
    // This means you are running init
    return null
  }
}

const writeTruffleConfig = ({ ensAddress }) => {
  const truffleConfig = getTruffleConfig()
  if (truffleConfig.networks.development) {
    truffleConfig.networks.development.ens = ensAddress
    fs.writeFileSync(`${findProjectRoot()}/truffle.js`, `module.exports = ${JSON.stringify(truffleConfig, null, 2)}`)
  }
}

const getENSAddress = (network = 'development') => {
  const truffleConfig = getTruffleConfig()
  if (!truffleConfig) {
    return ''
  }
  if (truffleConfig.networks[network].ens) {
    return truffleConfig.networks[network].ens
  } else {
    throw new Error(`No ENS address found for network ${network} in truffle.js`)
  }
}

module.exports = { getTruffleConfig, getENSAddress, writeTruffleConfig }