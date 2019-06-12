const fs = require('fs')
const { findProjectRoot } = require('../util')

const getTruffleConfig = () => {
  try {
    if (fs.existsSync(`${findProjectRoot()}/truffle.js`)) {
      const truffleConfig = require(`${findProjectRoot()}/truffle`)
      return truffleConfig
    }

    if (fs.existsSync(`${findProjectRoot()}/truffle-config.js`)) {
      const truffleConfig = require(`${findProjectRoot()}/truffle-config.js`)
      return truffleConfig
    }
  } catch (err) {
    console.log(err)
    // This means you are running init
    return null
  }

  throw new Error(`Didn't find any truffle.js file`)
}

module.exports = { getTruffleConfig }
