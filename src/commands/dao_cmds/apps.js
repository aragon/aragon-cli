import initAragonJS from './utils/aragonjs-wrapper'
const TaskList = require('listr')
const chalk = require('chalk')
const daoArg = require('./utils/daoArg')
const { listApps } = require('./utils/knownApps')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const listrOpts = require('../../helpers/listr-options')

const Table = require('cli-table')

let knownApps

exports.command = 'apps <dao>'

exports.describe = 'Get all the apps in a DAO'

exports.builder = function(yargs) {
  return daoArg(yargs)
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
  network,
  apm: apmOptions,
  wsProvider,
  module,
  silent,
  debug,
}) {
  knownApps = listApps([module.appName])
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
    ],
    listrOpts(silent, debug)
  )

  return tasks.run().then(ctx => {
    reporter.success(`Successfully fetched DAO apps for ${ctx.daoAddress}`)
    const appsContent = ctx.apps.map(
      ({ appId, proxyAddress, codeAddress, content, appName, version }) => [
        appName ? `${appName}@v${version}` : printAppName(appId),
        proxyAddress,
        printContent(content),
      ]
    )

    // filter registry name to make it shorter
    // TODO: Add flag to turn off
    const filteredContent = appsContent.map(row => {
      row[0] = row[0].replace('.aragonpm.eth', '')
      return row
    })

    const table = new Table({
      head: ['App', 'Proxy address', 'Content'].map(x => chalk.white(x)),
    })

    filteredContent.forEach(row => table.push(row))

    console.log(table.toString())
    process.exit() // force exit, as aragonjs hangs
  })
}
