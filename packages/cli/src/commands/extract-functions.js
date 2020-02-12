import path from 'path'
import { blue } from 'chalk'
import TaskList from 'listr'
import { extractContractInfoToFile } from '@aragon/toolkit' // TODO: Move away from toolkit?

export const command = 'extract-functions [contract]'
export const describe = 'Extract function information from a Solidity file'

export const builder = function(yargs) {
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

export const handler = async function({ cwd, reporter, contract, output }) {
  let outputPath

  const tasks = new TaskList([
    {
      title: 'Extracting functions',
      task: async () => {
        const contractPath = path.resolve(cwd, contract)
        const filename = path.basename(contractPath).replace('.sol', '.json')
        outputPath = path.resolve(output, filename)
        await extractContractInfoToFile(contractPath, outputPath)
      },
    },
  ])

  await tasks.run()
  reporter.success(`Saved to ${blue(outputPath)}`)
}
