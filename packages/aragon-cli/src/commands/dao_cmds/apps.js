const TaskList = require('listr')
const chalk = require('chalk')
const daoArg = require('./utils/daoArg')
const { listApps } = require('./utils/knownApps')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const { addressesEqual } = require('../../util')
const Table = require('cli-table')
const { getDaoAddress, getInstalledApps, getAllApps } = require('../../lib/dao/apps')

let knownApps

exports.command = 'apps <dao>'

exports.describe = 'Get all the apps in a DAO'

exports.builder = function(yargs) {
  return daoArg(yargs).option('all', {
    description: 'Whether to include apps without permissions as well',
    boolean: true,
  })
}

const printAppNameFromAppId = appId => {
  return knownApps[appId] ? chalk.blue(knownApps[appId]) : appId
}

const printAppNameAndVersion = (appName, version) => {
  return version ? chalk.blue(`${appName}@v${version}`) : chalk.blue(appName)
}

const printContent = content => {
  if (!content) {
    return '(No UI available)'
  }

  return `${content.provider}:${content.location}`
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
  let apps, daoAddress

  const tasks = new TaskList(
    [
      {
        title: 'Inspecting DAO',
        task: async (ctx, task) => {
          task.output = `Fetching apps for ${dao}...`
          const { 'ens-registry': ensRegistry, ipfs } = apmOptions
          const options = {
            registryAddress: ensRegistry,
            ipfs,
            provider: wsProvider || web3.currentProvider,
          }

          apps = await getInstalledApps(dao, options)
          daoAddress = await getDaoAddress(dao, options)
        },
      },
      {
        title: 'Fetching permissionless apps',
        enabled: () => all,
        task: async (ctx, task) => {
          /*
          const kernel = new web3.eth.Contract(kernelAbi, daoAddress)

          const events = await kernel.getPastEvents('NewAppProxy', {
            fromBlock: await kernel.methods.getInitializationBlock().call(),
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
                !apps.find(app =>
                  addressesEqual(app.proxyAddress, proxyAddress)
                )
            )*/
          ctx.appsWithoutPermissions = await getAllApps(daoAddress, { web3 })
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks.run().then(ctx => {
    reporter.success(
      `Successfully fetched DAO apps for ${chalk.green(daoAddress)}`
    )
    const appsContent = apps
      .map(
        ({ appId, proxyAddress, codeAddress, content, appName, version }) => [
          appName
            ? printAppNameAndVersion(appName, version)
            : printAppNameFromAppId(appId),
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
    if (ctx.appsWithoutPermissions) {
      const tableForPermissionlessApps = new Table({
        head: ['Permissionless app', 'Proxy address'].map(x => chalk.white(x)),
      })
      ctx.appsWithoutPermissions.forEach(app =>
        tableForPermissionlessApps.push([
          printAppNameFromAppId(app.appId).replace('.aragonpm.eth', ''),
          app.proxyAddress,
        ])
      )
      console.log(tableForPermissionlessApps.toString())
    }

    process.exit() // force exit, as aragonjs hangs
  })
}
