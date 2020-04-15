import flattenCode from '../helpers/flattenCode'
import { getTruffleConfig } from './truffle-config'

export default async (contractArtifacts) => {
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
