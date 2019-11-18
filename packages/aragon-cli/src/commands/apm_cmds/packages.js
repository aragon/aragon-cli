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
  let packages

  const tasks = new TaskList([
    {
      title: `Fetching APM packages for ${apmRegistry}`,
      task: async (ctx, task) => {
        task.output = `Initializing APM`

        const progressHandler = step => {
          switch (step) {
            case 1:
              task.output = `Fetching APM Registry`
              break
            case 2:
              task.output = `Gathering packages in registry`
              break
          }
        }

        packages = await getApmRegistryPackages(
          web3,
          apmRegistry,
          apmOptions,
          progressHandler
        )
      },
    },
  ])

  await tasks.run()

  displayPackages(packages)
  process.exit()
}

/**
 * Display packages and their version in a table
 *
 * @param {Object[]} packages Packages
 * @returns {void}
 */
function displayPackages(packages) {
  const table = new Table({
    head: ['App', 'Latest Version'],
  })

  packages.forEach(aPackage => {
    const row = [aPackage.name, aPackage.version]
    table.push(row)
  })

  console.log(table.toString())
}
