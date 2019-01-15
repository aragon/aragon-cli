import initAragonJS from './utils/aragonjs-wrapper'
const TaskList = require('listr')
const chalk = require('chalk')
const daoArg = require('./utils/daoArg')
const { listApps } = require('./utils/knownApps')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const listrOpts = require('../../helpers/listr-options')
const { getContract } = require('../../util')
const Table = require('cli-table')

const addressesEqual = (a, b) => a.toLowerCase() === b.toLowerCase()

let knownApps

exports.command = 'apps <dao>'

exports.describe = 'Get all the apps in a DAO'

exports.builder = function(yargs) {
  return daoArg(yargs).option('all', {
    description: 'Whether to include apps without permissions as well',
    boolean: true,
  })
}

const printAppName = appId => {
  return knownApps[appId] ? knownApps[appId] : appId.slice(0, 10) + '...'
}

const printContent = content => {
  if (!content) {
    return '(No UI available)'
  }

  return `${content.provider}:${content.location}`.slice(0, 25) + '...'
}

exports.handler = async function({
  reporter,
  dao,
  all,
  network,
  apm: apmOptions,
  wsProvider,
  module,
  silent,
  debug,
}) {
  knownApps = listApps(module ? [module.appName] : [])
  const web3 = await ensureWeb3(network)

  const tasks = new TaskList(
    [
      {
        title: 'Inspecting DAO',
        task: (ctx, task) => {
          task.output = `Fetching apps for ${dao}...`

          return new Promise((resolve, reject) => {
            initAragonJS(dao, apmOptions['ens-registry'], {
              provider: wsProvider || web3.currentProvider,
              onApps: apps => {
                ctx.apps = apps
                resolve()
              },
              onDaoAddress: addr => {
                ctx.daoAddress = addr
              },
              onError: err => reject(err),
            }).catch(err => {
              reporter.error('Error inspecting DAO apps')
              reporter.debug(err)
              process.exit(1)
            })
          })
        },
      },
      {
        title: 'Fetching permissionless apps',
        enabled: () => all,
        task: async (ctx, task) => {
          const kernel = new web3.eth.Contract(
            getContract('@aragon/os', 'Kernel').abi,
            ctx.daoAddress
          )

          const events = await kernel.getPastEvents('NewAppProxy', {
            fromBlock: 0,
            toBlock: 'latest',
          })

          ctx.appsWithoutPermissions = events
            .map(event => ({
              proxyAddress: event.returnValues.proxy,
              appId: event.returnValues.appId,
            }))
            // Remove apps that have permissions
            .filter(
              ({ proxyAddress }) =>
                !ctx.apps.find(app =>
                  addressesEqual(app.proxyAddress, proxyAddress)
                )
            )
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks.run().then(ctx => {
    reporter.success(`Successfully fetched DAO apps for ${ctx.daoAddress}`)
    const appsContent = ctx.apps
      .map(
        ({ appId, proxyAddress, codeAddress, content, appName, version }) => [
          appName ? `${appName}@v${version}` : printAppName(appId),
          proxyAddress,
          printContent(content),
        ]
      )
      // filter registry name to make it shorter
      // TODO: Add flag to turn off
      .map(row => {
        row[0] = row[0].replace('.aragonpm.eth', '')
        return row
      })

    const table = new Table({
      head: ['App', 'Proxy address', 'Content'].map(x => chalk.white(x)),
    })
    appsContent.forEach(row => table.push(row))
    console.log(table.toString())

    // Print permisionless apps
    const table2 = new Table({
      head: ['Permissionless app', 'Proxy address'].map(x => chalk.white(x)),
    })
    ctx.appsWithoutPermissions.forEach(app =>
      table2.push([
        printAppName(app.appId).replace('.aragonpm.eth', ''),
        app.proxyAddress,
      ])
    )
    console.log(table2.toString())

    process.exit() // force exit, as aragonjs hangs
  })
}
