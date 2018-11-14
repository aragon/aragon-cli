import initAragonJS from '../utils/aragonjs-wrapper'
const chalk = require('chalk')
const TaskList = require('listr')
const daoArg = require('../utils/daoArg')
const { listApps } = require('../utils/knownApps')
const { rolesForApps } = require('./utils/knownRoles')
const { ensureWeb3 } = require('../../../helpers/web3-fallback')
const listrOpts = require('../../../helpers/listr-options')

const Table = require('cli-table')

const knownRoles = rolesForApps()
const ANY_ENTITY = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'
const ANY_ENTITY_TEXT = 'Any entity'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

let knownApps

exports.command = 'view <dao>'

exports.describe = 'Inspect permissions in a DAO'

exports.builder = function (yargs) {
  return daoArg(yargs)
}

const printAppName = (appId, addr) => {
  if (addr === ANY_ENTITY) return ANY_ENTITY_TEXT
  return knownApps[appId] ? `${knownApps[appId].split('.')[0]} (${addr.slice(0, 6)})` : addr.slice(0, 16) + '...'
}

const appFromProxyAddress = (proxyAddress, apps) => {
  return apps.filter(app => app.proxyAddress === proxyAddress)[0] || {}
}

const formatRow = ({ to, role, allowedEntities, manager }, apps) => {
  if (manager === ZERO_ADDRESS && (!allowedEntities || allowedEntities.length === 0)) {
    return null
  }

  const formattedTo = printAppName(appFromProxyAddress(to, apps).appId, to)
  let formattedRole = knownRoles[role] || `${role.slice(0, 8)}..${role.slice(-6)}`
  if (formattedRole['id']) formattedRole = formattedRole['id']
  const formattedAllowed = allowedEntities.reduce((acc, addr) => {
    const allowedName = printAppName(appFromProxyAddress(addr, apps).appId, addr)
    const allowedEmoji = allowedName === ANY_ENTITY_TEXT ? '🆓' : '✅'
    return acc + '\n' + allowedEmoji + '  ' + allowedName
  }, '').slice(1) // remove first newline
  const formattedManager = printAppName(appFromProxyAddress(manager, apps).appId, manager)

  return [formattedTo, formattedRole, formattedAllowed, formattedManager]
}

exports.handler = async function ({ reporter, dao, network, apm, module, silent, debug }) {
  knownApps = listApps([module.appName])
  const web3 = await ensureWeb3(network)

  const tasks = new TaskList([
    {
      title: 'Inspecting DAO Permissions',
      task: (ctx, task) => {
        task.output = `Fetching permissions for ${dao}...`

        return new Promise((resolve, reject) => {
          const resolveIfReady = () => {
            if (ctx.acl && ctx.apps) {
              resolve()
            }
          }

          initAragonJS(dao, apm['ens-registry'], {
            provider: web3.currentProvider,
            onPermissions: permissions => {
              ctx.acl = permissions
              resolveIfReady()
            },
            onApps: apps => {
              ctx.apps = apps
              resolveIfReady()
            },
            onDaoAddress: addr => { ctx.daoAddress = addr },
            onError: err => reject(err)
          }).catch(err => {
            reporter.error('Error inspecting DAO')
            reporter.debug(err)
            process.exit(1)
          })
        })
      }
    }
  ],
    listrOpts(silent, debug)
  )

  return tasks.run()
    .then((ctx) => {
      reporter.success(`Successfully fetched DAO apps for ${ctx.daoAddress}`)

      let acl = ctx.acl

      // filter according to cli params will happen here

      const table = new Table({
        head: ['App', 'Action', 'Allowed entities', 'Manager'].map(x => chalk.white(x))
      })

      const tos = Object.keys(acl)

      const flattenedACL = tos.reduce((acc, to) => {
        const roles = Object.keys(acl[to])
        const permissions = roles.map((role) => ({ to, role, ...acl[to][role] }))

        return acc.concat(permissions)
      }, [])

      flattenedACL.map(row => formatRow(row, ctx.apps)).filter(row => row).forEach(row => table.push(row))

      console.log(table.toString())
      process.exit() // force exit, as aragonjs hangs
    })
}
