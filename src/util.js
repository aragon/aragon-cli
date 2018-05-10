const findUp = require('find-up')
const path = require('path')
const hasbin = require('hasbin')

const findProjectRoot = () => path.dirname(findUp.sync('arapp.json'))

const hasBin = (bin) => new Promise((resolve, reject) => hasbin(bin, resolve))

module.exports = { findProjectRoot, hasBin }
