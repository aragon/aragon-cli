const flatten = require('truffle-flattener')
const { getTruffleConfig } = require('./truffle-config')

module.exports = async contractArtifacts => {
  try {
    const {
      contractName,
      sourcePath,
      updatedAt: compiledAt,
      compiler,
    } = contractArtifacts

    const solcConfig = getTruffleConfig().solc
    compiler.optimizer = solcConfig ? solcConfig.optimizer : { enabled: false }

    // TODO: Refactor this functionality
    const flattenedCode = await flatten([sourcePath])

    return {
      contractName,
      compiledAt,
      compiler,
      flattenedCode,
    }
  } catch (e) {
    // Better error for a truffle-flattener issue not supporting cyclic dependencies
    // TODO : remove if this issue is addressed
    // https://github.com/nomiclabs/truffle-flattener/issues/14
    // https://github.com/aragon/aragon-cli/issues/780
    if (/cycle.+dependency/.test(e.message))
      throw Error(`Cyclic dependencies in .sol files are not supported.
'truffle-flattener' requires all cyclic dependencies to be resolved before proceeding.
To do so, you can:
- Remove unnecessary import statements, if any
- Abstract the interface of imported contracts in a separate file
- Merge multiple contracts in a single .sol file
`)
    else throw e
  }
}
