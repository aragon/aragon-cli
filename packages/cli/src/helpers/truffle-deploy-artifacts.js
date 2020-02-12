import { getTruffleConfig } from '@aragon/toolkit'
//
import flattenCode from '../helpers/flattenCode'

export default async contractArtifacts => {
  const {
    contractName,
    sourcePath,
    updatedAt: compiledAt,
    compiler,
  } = contractArtifacts

  const solcConfig = getTruffleConfig().solc
  compiler.optimizer = solcConfig ? solcConfig.optimizer : { enabled: false }

  const flattenedCode = await flattenCode([sourcePath])

  return {
    contractName,
    compiledAt,
    compiler,
    flattenedCode,
  }
}
