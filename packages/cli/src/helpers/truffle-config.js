import fs from 'fs'
//
import { findProjectRoot } from '../util'

const transformToTruffle5 = config => {
  if (Object.prototype.hasOwnProperty.call(config, 'solc')) {
    const v5Config = {
      ...config,
      compilers: {
        solc: {
          version: '0.4.24',
          settings: {
            ...config.solc,
          },
        },
      },
    }

    // remove v4 key
    delete v5Config.solc

    return v5Config
  }
  return config
}

export const getTruffleConfig = () => {
  try {
    if (fs.existsSync(`${findProjectRoot()}/truffle.js`)) {
      const truffleConfig = require(`${findProjectRoot()}/truffle`)
      return transformToTruffle5(truffleConfig)
    }

    if (fs.existsSync(`${findProjectRoot()}/truffle-config.js`)) {
      const truffleConfig = require(`${findProjectRoot()}/truffle-config.js`)
      return transformToTruffle5(truffleConfig)
    }
  } catch (err) {
    console.log(err)
    // This means you are running init
    return undefined
  }

  throw new Error(`Didn't find any truffle.js file`)
}
