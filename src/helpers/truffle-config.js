const fs = require('fs')
const { findProjectRoot } = require('../util')

const getTruffleConfig = () => {
  try {
    if (fs.existsSync(`${findProjectRoot()}/truffle.js`)) {
      const truffleConfig = require(`${findProjectRoot()}/truffle.js`)
      return truffleConfig
    } else {
      throw new Error(`Didn't found any truffle.js file`)
    }
  } catch (err) {
    // This means you are running init
    return null
  }
}

const getENSAddress = (network) => {
  const truffleConfig = getTruffleConfig()
  const def = '0xB9462EF3441346dBc6E49236Edbb0dF207db09B7'
  if (!truffleConfig) {
    return def
  }
  if (truffleConfig.networks[network].ens) {
    return truffleConfig.networks[network].ens
  } else {
    return def
    // throw new Error(`No ENS address found for network ${network} in truffle.js`)
  }
}

module.exports = { getTruffleConfig, getENSAddress }