const APM = require('@aragon/apm')
const chalk = require('chalk')
const Table = require('cli-table')
const TaskList = require('listr')
const { ensureWeb3 } = require('../../helpers/web3-fallback')

exports.command = 'packages'

exports.describe = 'List all packages in the registry'

exports.handler = async function({
  reporter,
  module,
  network,
  apm: apmOptions,
}) {
  const web3 = await ensureWeb3(network)

  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)

  const tasks = new TaskList([
    {
      title: 'Fetching APM Registry',
      task: async (ctx, task) => {
        ctx.registry = await apm.getRepoRegistry(module.appName)
      },
    },
    {
      title: 'Gathering Repos',
      task: async (ctx, task) => {
        const e = await ctx.registry.getPastEvents('NewRepo', { fromBlock: 0 })

        ctx.names = e.map(ev => ev.returnValues.name)
        ctx.versions = await Promise.all(
          e.map(async ev => apm.getLatestVersion(ev.returnValues.id))
        )
      },
    },
  ])

  return tasks.run().then(ctx => {
    const repoId = module.appName
      .split('.')
      .slice(1)
      .join('.')
    reporter.success(`Successfully fetched packages for ${repoId}`)

    const rows = ctx.versions.map((info, index) => {
      return [ctx.names[index], info.version]
    })

    const table = new Table({
      head: ['App', 'Latest Version'].map(x => chalk.white(x)),
    })

    rows.forEach(r => table.push(r))

    console.log(table.toString())
    process.exit()
  })
}
