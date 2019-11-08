const APM = require('@aragon/apm')
const chalk = require('chalk')
const Table = require('cli-table')
const TaskList = require('listr')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const getApmRegistryPackages = require('../../lib/apm/getApmRegistryPackages')

exports.command = 'packages [apmRegistry]'

exports.describe = 'List all packages in the registry'

exports.builder = function(yargs) {
  return yargs.option('apmRegistry', {
    description: 'The registry to inspect',
    type: 'string',
    default: 'aragonpm.eth',
  })
}

exports.handler = async function({
  reporter,
  apmRegistry,
  network,
  apm: apmOptions,
}) {
  const web3 = await ensureWeb3(network)
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const progressHandler = (step) => {
    switch(step) {
      case 1:
        console.log(`Fetching APM Registry: ${apmRegistry}`)
        break
      case 4:
        console.log(`Gathering packages in registry`)
        break
      case 5:
        console.log(`Successfully fetched packages`)
        break
    }
  }

  const packages = await getApmRegistryPackages(web3, apmRegistry, apmOptions, progressHandler)

  const table = new Table({
    head: ['App', 'Latest Version'],
  })

  packages.map(aPackage => {
    const row = [aPackage.name, aPackage.version]
    table.push(row)
  })

  console.log(table.toString())

  process.exit()
}
