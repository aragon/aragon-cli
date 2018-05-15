const findUp = require('find-up')
const path = require('path')
const hasbin = require('hasbin')

let cachedProjectRoot

const findProjectRoot = () => {
  if (!cachedProjectRoot) {
    cachedProjectRoot = path.dirname(findUp.sync('arapp.json'))
  }
  return cachedProjectRoot
}

const hasBin = (bin) => new Promise((resolve, reject) => hasbin(bin, resolve))

module.exports = { findProjectRoot, hasBin }
