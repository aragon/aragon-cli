import fs from 'fs'
import { writeJson } from 'fs-extra'
//
import { extractContractInfo } from './solidity-extractor'
const readFile = fs.promises.readFile

// TODO: Move away from Toolkit

export default async function extractContractInfoToFile(
  contractPath,
  outputPath
) {
  const sourceCode = await readFile(contractPath, 'utf8')
  const contractInfo = await extractContractInfo(sourceCode)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
