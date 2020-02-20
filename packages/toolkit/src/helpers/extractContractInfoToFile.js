import { writeJson, readFile } from 'fs-extra'
//
import { extractContractInfo } from '../utils/solidityExtractor'

// TODO: Move away from Toolkit

export default async function extractContractInfoToFile(
  contractPath,
  outputPath
) {
  const sourceCode = await readFile(contractPath, 'utf8')
  const contractInfo = await extractContractInfo(sourceCode)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
