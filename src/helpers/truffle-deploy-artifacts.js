const flatten = require('truffle-flattener')
const { getTruffleConfig } = require('./truffle-config')

module.exports = async (contractArtifacts) => {
  const {
    contractName,
    sourcePath,
    updatedAt: compiledAt,
    compiler
  } = contractArtifacts

  compiler.optimizer = getTruffleConfig().solc.optimizer
  const flattenedCode = await flatten([ sourcePath ])

  return {
    contractName,
    compiledAt,
    compiler,
    flattenedCode
  }
}