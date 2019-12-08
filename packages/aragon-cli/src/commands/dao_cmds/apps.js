const TaskList = require('listr')
const Table = require('cli-table')
const { blue, green, white } = require('chalk')
const { addressesEqual } = require('@aragon/toolkit/dist/util')
const {
  getDaoAddress,
  getInstalledApps,
  getAllApps,
} = require('@aragon/toolkit/dist/dao/apps')
//
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const listrOpts = require('../../helpers/listr-options')
const daoArg = require('./utils/daoArg')
const { listApps } = require('./utils/knownApps')

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
  return knownApps[appId] ? blue(knownApps[appId]) : appId
}

const printAppNameAndVersion = (appName, version) => {
  return version ? blue(`${appName}@v${version}`) : blue(appName)
}

const printContent = content => {
  if (!content) {
    return '(No UI available)'
  }

  return `${content.provider}:${content.location}`
}

const printApps = apps => {
  const appsContent = apps
    .map(({ appId, proxyAddress, codeAddress, content, appName, version }) => [
      appName
        ? printAppNameAndVersion(appName, version)
        : printAppNameFromAppId(appId),
      proxyAddress,
      printContent(content),
    ])
    .map(row => {
      row[0] = row[0].replace('.aragonpm.eth', '')
      return row
    })

  const table = new Table({
    head: ['App', 'Proxy address', 'Content'].map(x => white(x)),
  })
  appsContent.forEach(row => table.push(row))
  console.log(table.toString())
}

const printPermissionlessApps = apps => {
  if (apps && apps.length) {
    const tableForPermissionlessApps = new Table({
      head: ['Permissionless app', 'Proxy address'].map(x => white(x)),
    })
    apps.forEach(app =>
      tableForPermissionlessApps.push([
        printAppNameFromAppId(app.appId).replace('.aragonpm.eth', ''),
        app.proxyAddress,
      ])
    )
    console.log(tableForPermissionlessApps.toString())
  }
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
  let apps, daoAddress, appsWithoutPermissions

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
          appsWithoutPermissions = (
            await getAllApps(daoAddress, {
              web3,
            })
          ).filter(
            ({ proxyAddress }) =>
              !apps.find(app => addressesEqual(app.proxyAddress, proxyAddress))
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )

  await tasks.run()

  reporter.success(`Successfully fetched DAO apps for ${green(daoAddress)}`)

  printApps(apps)
  printPermissionlessApps(appsWithoutPermissions)
  process.exit()
}
