const path = require('path')
const { keccak256 } = require('web3').utils
const { writeJson } = require('fs-extra')
const extract = require('../../helpers/solidity-extractor')
const chalk = require('chalk')

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

exports.handler = async function({
  cwd,
  reporter,

  contract,
  output,
}) {
  // Analyse contract functions and returns an array
  // > [{ sig: 'transfer(address)', role: 'X_ROLE', notice: 'Transfers..'}]
  const functions = await extract(path.resolve(cwd, contract))

  const roleSet = new Set()
  functions.forEach(({ roles }) => roles.forEach(role => roleSet.add(role)))
  const roleIds = [...roleSet]

  const roles = roleIds.map(id => ({
    id,
    bytes: keccak256(id),
    name: '', // Name and params can't be extracted from solidity file, must be filled in manually
    params: [],
  }))

  const content = {
    roles,
    functions,
  }

  const filename = path.basename(contract).replace('.sol', '.json')
  const outputPath = path.resolve(output, filename)

  await writeJson(outputPath, content, { spaces: '\t' })

  reporter.success(`Saved to ${chalk.blue(outputPath)}`)
}
