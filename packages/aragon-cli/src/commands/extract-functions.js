const path = require('path')
const chalk = require('chalk')
const extractContractInfoToFile = require('../lib/extractContractInfoToFile')
const TaskList = require('listr')

exports.command = 'extract-functions [contract]'

exports.describe = 'Extract function information from a Solidity file'

exports.builder = function(yargs) {
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

exports.handler = async function({ cwd, reporter, contract, output }) {
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
  reporter.success(`Saved to ${chalk.blue(outputPath)}`)
  process.exit()
}
