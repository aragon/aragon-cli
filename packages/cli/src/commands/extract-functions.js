import path from 'path'
import { blue } from 'chalk'
import TaskList from 'listr'
import { extractContractInfoToFile } from '@aragon/toolkit'
import { exists, readJson } from 'fs-extra'

export const command = 'extract-functions [contract]'
export const describe = 'Extract function information from a Solidity file'

export const builder = function (yargs) {
  return yargs
    .positional('contract', {
      description: 'Path to the Solidity file to extract functions from',
      type: 'string',
    })
    .option('output', {
      description:
        'Path of the directory where the output file will be saved to',
      type: 'string',
      default: '.',
    })
}

export const handler = async function ({ cwd, reporter, contract, output }) {
  let outputPath

  const tasks = new TaskList([
    {
      title: 'Extracting functions',
      task: async () => {
        const contractPath = path.resolve(cwd, contract)
        const filename = path.basename(contractPath).replace('.sol', '.json')
        const contractArtifactPath = path.resolve(
          cwd,
          'build/contracts',
          filename
        )

        if (!(await exists(contractArtifactPath))) {
          throw new Error(`Could not find artifact ${contractArtifactPath}`)
        }

        const contractArtifact = await readJson(contractArtifactPath)
        outputPath = path.resolve(output, filename)
        await extractContractInfoToFile(
          contractPath,
          contractArtifact.abi,
          outputPath
        )
      },
    },
  ])

  await tasks.run()
  reporter.success(`Saved to ${blue(outputPath)}`)
}
