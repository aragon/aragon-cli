import { writeJson, readFile } from 'fs-extra'
//
import { extractContractInfo } from './solidity-extractor'

// TODO: Move away from Toolkit

export default async (contractPath, outputPath) => {
  const sourceCode = await readFile(contractPath, 'utf8')
  const contractInfo = await extractContractInfo(sourceCode)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
