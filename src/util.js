const findUp = require('find-up')
const path = require('path')
const hasbin = require('hasbin')

const cachedProjectRoot = path.dirname(findUp.sync('arapp.json'))

const findProjectRoot = () => cachedProjectRoot

const hasBin = (bin) => new Promise((resolve, reject) => hasbin(bin, resolve))

module.exports = { findProjectRoot, hasBin }
