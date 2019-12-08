import { writeJson } from 'fs-extra'
//
import { extractContractInfo } from './solidity-extractor'

export default async (contractPath, outputPath) => {
  const contractInfo = await extractContractInfo(contractPath)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
