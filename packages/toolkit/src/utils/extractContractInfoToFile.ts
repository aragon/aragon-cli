import { writeJson, readFile } from 'fs-extra'
//
import { extractContractInfo } from './solidityExtractor'

// TODO: Move away from Toolkit

export async function extractContractInfoToFile(
  contractPath: string,
  outputPath: string
): Promise<void> {
  const sourceCode = await readFile(contractPath, 'utf8')
  const contractInfo = await extractContractInfo(sourceCode)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
