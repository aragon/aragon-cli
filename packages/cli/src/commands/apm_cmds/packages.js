import Table from 'cli-table'
import TaskList from 'listr'
import { Toolkit } from '@aragon/toolkit'

export const command = 'packages [apmRegistry]'
export const describe = 'List all packages in the registry'

export const builder = function(yargs) {
  return yargs.option('apmRegistry', {
    description: 'The registry to inspect',
    type: 'string',
    default: 'aragonpm.eth',
  })
}

export const handler = async function({ apmRegistry, environment }) {
  let packages

  const tasks = new TaskList([
    {
      title: `Fetching APM packages for ${apmRegistry}`,
      task: async (ctx, task) => {
        task.output = `Initializing APM`

        const toolkit = Toolkit(environment)
        packages = await toolkit.apm.getRegistryPackages(apmRegistry)
      },
    },
  ])

  await tasks.run()

  displayPackages(packages)
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

  console.log('\n', table.toString())
}
