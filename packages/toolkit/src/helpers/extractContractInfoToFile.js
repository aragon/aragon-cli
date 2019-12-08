const { writeJson } = require('fs-extra')
//
const extract = require('./solidity-extractor')

module.exports = async (contractPath, outputPath) => {
  const contractInfo = await extract(contractPath)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
