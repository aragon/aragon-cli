const flatten = require('truffle-flattener')

module.exports = async (sourcePath) => {
  let flattenedCode
  try {
    flattenedCode = await flatten([sourcePath])
  } catch (error) {
    const cycleDependencyErrorDetected = /cycle.+dependency/.test(error.message)
    if (cycleDependencyErrorDetected) {
      throw Error(`Cyclic dependencies in .sol files are not supported.
'truffle-flattener' requires all cyclic dependencies to be resolved before proceeding.
To do so, you can:
- Remove unnecessary import statements, if any
- Abstract the interface of imported contracts in a separate file
- Merge multiple contracts in a single .sol file

Original error: ${error}
`)
    } else {
      throw error
    }
  }
}
