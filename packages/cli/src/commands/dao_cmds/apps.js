import TaskList from 'listr'
import Table from 'cli-table'
import { blue, green, white } from 'chalk'
import Web3 from 'web3'
import {
  getDaoAddress,
  getInstalledApps,
  getAllApps,
  addressesEqual,
} from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'
import listrOpts from '../../helpers/listr-options'

import daoArg from './utils/daoArg'
import { listApps } from './utils/knownApps'

let knownApps

export const command = 'apps <dao>'
export const describe = 'Get all the apps in a DAO'

export const builder = function(yargs) {
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
    .map(({ appId, proxyAddress, content, appName, version }) => [
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

export const handler = async function({
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
          const { ensRegistryAddress, ipfs } = apmOptions
          const options = {
            registryAddress: ensRegistryAddress,
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
              web3: new Web3(wsProvider || web3.currentProvider)
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

  reporter.newLine()
  reporter.success(`Successfully fetched DAO apps for ${green(daoAddress)}`)

  printApps(apps)
  printPermissionlessApps(appsWithoutPermissions)
}
