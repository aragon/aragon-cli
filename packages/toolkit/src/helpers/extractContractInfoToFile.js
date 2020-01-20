import fs from 'fs'
import { promisify } from 'util'
import { writeJson } from 'fs-extra'
//
import { extractContractInfo } from './solidity-extractor'
const readFile = promisify(fs.readFile)

// TODO: Move away from Toolkit

export default async (contractPath, outputPath) => {
  const sourceCode = await readFile(contractPath, 'utf8')
  const contractInfo = await extractContractInfo(sourceCode)

  await writeJson(outputPath, contractInfo, { spaces: '\t' })
}
