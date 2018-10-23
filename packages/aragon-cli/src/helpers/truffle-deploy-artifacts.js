const flatten = require('truffle-flattener')
const { getTruffleConfig } = require('./truffle-config')

module.exports = async (contractArtifacts) => {
  const {
    contractName,
    sourcePath,
    updatedAt: compiledAt,
    compiler
  } = contractArtifacts

  const solcConfig = getTruffleConfig().solc
  compiler.optimizer = solcConfig ? solcConfig.optimizer : { enabled: false }
  const flattenedCode = await flatten([ sourcePath ])

  return {
    contractName,
    compiledAt,
    compiler,
    flattenedCode
  }
}
