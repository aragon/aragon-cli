const TaskList = require('listr')
const Web3 = require('web3')
const daoArg = require('./utils/daoArg')
import initAragonJS from './utils/aragonjs-wrapper'
const { listApps } = require('./utils/knownApps')
const { rolesForApps } = require('./acl_cmds/utils/knownRoles')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
import { addressesEqual } from './utils/web3-utils'
var stringify = require('json-stringify-safe');

const Table = require('cli-table')
const colors = require('colors')

const knownRoles = rolesForApps()
const ANY_ENTITY = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'
const ANY_ENTITY_TEXT = 'Any entity'

const path = require('path')
let knownApps

exports.command = 'call <dao> <proxy-address> <fn> [fn-args]'

exports.describe = 'Inspect permissions in a DAO'

exports.builder = function (yargs) {
  return daoArg(yargs)
  .positional('proxy-address', {
    description: 'Proxy address of the app with the function to be run'
  })
  .positional('fn', {
    description: 'Function to be called'
  })
  .option('fn-args', {
    description: 'Arguments to be passed to the function',
    array: true,
    default: [],
  })
}

exports.handler = async function ({ reporter, dao, apm, network, proxyAddress, fn, fnArgs }) {
  knownApps = listApps()
  const web3 = await ensureWeb3(network)

  const tasks = new TaskList([
    {
      title: 'Generating transaction',
      task: async (ctx, task) => {
        task.output = `Fetching dao at ${dao}...`


        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

        return new Promise((resolve, reject) => {


          initAragonJS(dao, apm['ens-registry'], {
            accounts: ctx.accounts,
            provider: web3.currentProvider,
            onTransaction: transaction => {
              ctx.transaction = transaction
            },
            onPermissions: permissions => {
              ctx.acl = permissions
            },
            onApps: async apps => {
              ctx.apps = apps
              if (ctx.wrapper) {
                ctx.transactionPath = await ctx.wrapper.getTransactionPath(proxyAddress, fn, fnArgs)
                resolve()
              }
            },
            onDaoAddress: addr => ctx.daoAddress = addr,
            onError: err => reject(err)
          })
            .then(async wrapper => {
              ctx.wrapper = wrapper
              if (ctx.apps) {
                ctx.transactionPath = await ctx.wrapper.getTransactionPath(proxyAddress, fn, fnArgs)
                resolve()
              }
            })
            .catch(err => {
              reporter.error('Error inspecting DAO')
              reporter.debug(err)
              process.exit(1)
            })
        })
      }
    },
    {
      title: `calling ${fn}`,
      task: async (ctx, task) => {
        task.output = `Waiting for response...`
        ctx.transactionPath[0].gas = await web3.eth.estimateGas(ctx.transactionPath[0])
        ctx.transactionPath[0].gas = ctx.transactionPath[0].gas *2 // need better estimations
        return new Promise((resolve, reject) => {
          web3.eth.sendTransaction(ctx.transactionPath[0],(err,res) => {
            if(err) reject(err)
            ctx.res=res
            resolve()
          })
        })
      }
    },
  ])

  return tasks.run()
    .then((ctx) => {
      reporter.success(`Successfully sent transaction starting with transaction: ` + JSON.stringify(ctx.transactionPath[0].description))
      process.exit()
    })
}
