import fs from 'fs'
import { findProjectRoot } from '../util'

export const getTruffleConfig = () => {
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
    return undefined
  }

  throw new Error(`Didn't find any truffle.js file`)
}
