const flattenCode = require('../helpers/flattenCode')
const { getTruffleConfig } = require('./truffle-config')

module.exports = async contractArtifacts => {
  const {
    contractName,
    sourcePath,
    updatedAt: compiledAt,
    compiler,
  } = contractArtifacts

  const solcConfig = getTruffleConfig().solc
  compiler.optimizer = solcConfig ? solcConfig.optimizer : { enabled: false }

  const flattenedCode = await flattenCode([sourcePath])

  return {
    contractName,
    compiledAt,
    compiler,
    flattenedCode,
  }
}
