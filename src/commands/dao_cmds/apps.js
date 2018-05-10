const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const TaskList = require('listr')
const execa = require('execa')
const Web3 = require('web3')
const daoArg = require('./utils/daoArg')
import initAragonJS from './utils/aragonjs-wrapper'
const { appIds } = require('./utils/knownApps')

const Table = require('cli-table')
const colors = require('colors')

exports.command = 'apps <dao>'

exports.describe = 'Get all the apps in a DAO'

exports.builder = function (yargs) {
  return daoArg(yargs)
}

const printAppName = (appId) => {
  return appIds[appId] ? appIds[appId] : appId.slice(0,10) + '...'
}

const printContent = (content) => {
  if (!content)
    return '(No UI available)'

  return `${content.provider}:${content.location}`.slice(0,25) + '...'
}

exports.handler = function ({ reporter, dao, keyfile, ethRpc }) {
  const web3 = new Web3(keyfile.rpc ? keyfile.rpc : ethRpc)

  const tasks = new TaskList([
      {
        title: 'Inspecting DAO',
        task: (ctx, task) => {
          task.output = `Fetching apps for ${dao}...`

          return new Promise((resolve, reject) => {
            initAragonJS(dao, keyfile.ens, {
              provider: web3.currentProvider,
              onApps: apps => {
                ctx.apps = apps
                resolve()
              },
              onDaoAddress: addr => ctx.daoAddress = addr,
            })
          })
        }
      },
    ])

    return tasks.run()
      .then((ctx) => {
        reporter.success(`Successfully fetched DAO apps for ${ctx.daoAddress}`)

        const appsContent = ctx.apps.map(
          ({ appId, proxyAddress, codeAddress, content }) => 
          ([ printAppName(appId), proxyAddress, printContent(content)])
        )
        const table = new Table({
          head: ['App', 'Proxy address', 'Content'].map(x => x.white),
          //colWidths: [100, 200]
        })

        appsContent.forEach(row => table.push(row))

        console.log(table.toString())
        process.exit() // force exit, as aragonjs hangs
      })
}