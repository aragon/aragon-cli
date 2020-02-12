import Table from 'cli-table'
import TaskList from 'listr'
import { getApmRegistryPackages } from '@aragon/toolkit'

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
          apmRegistry,
          progressHandler,
          environment
        )
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
