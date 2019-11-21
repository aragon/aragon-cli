const extract = require('../helpers/solidity-extractor')
const { writeJson } = require('fs-extra')

module.exports = async (contractPath, outputPath) => {
  const contractInfo = await extract(contractPath)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
