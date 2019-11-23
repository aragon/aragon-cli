import extract from '../helpers/solidity-extractor'
import { writeJson } from 'fs-extra'

export default async (contractPath, outputPath) => {
  const contractInfo = await extract(contractPath)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
