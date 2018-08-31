const TaskList = require('listr')
const Web3 = require('web3')
const daoArg = require('./utils/daoArg')
import initAragonJS from './utils/aragonjs-wrapper'
const { listApps } = require('./utils/knownApps')
const { rolesForApps } = require('./acl_cmds/utils/knownRoles')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
import { addressesEqual } from './utils/web3-utils'

const Table = require('cli-table')
const colors = require('colors')

const knownRoles = rolesForApps()
const ANY_ENTITY = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'
const ANY_ENTITY_TEXT = 'Any entity'
const GAS_ESTIMATE_ERROR_FACTOR = 2

const path = require('path')
let knownApps

exports.command = 'exec <dao> <proxy-address> <fn> [fn-args]'

exports.describe = 'Executes a call in an app of a DAO'

exports.builder = function (yargs) {
  return daoArg(yargs)
  .positional('proxy-address', {
    description: 'Proxy address of the app with the function to be run'
  })
  .positional('fn', {
    description: 'Function to be executed'
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
          let wrapper, appsLoaded

          const tryFindTransactionPath = async () => {
            if (appsLoaded && wrapper) {
              ctx.transactionPath = await wrapper.getTransactionPath(proxyAddress, fn, fnArgs)
              resolve()
            }
          }

          initAragonJS(dao, apm['ens-registry'], {
            accounts: ctx.accounts,
            provider: web3.currentProvider,
            onApps: async apps => {
              appsLoaded = true
              await tryFindTransactionPath()
            },
            onError: err => reject(err)
          })
          .then(async (initializedWrapper) => {
            wrapper = initializedWrapper
            await tryFindTransactionPath()
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
      title: `Executing ${fn} in ${proxyAddress}`,
      task: async (ctx, task) => {
        task.output = `Waiting for response...`
        let tx = ctx.transactionPath[0] // TODO: Support choosing between possible transaction paths

        if (!tx) {
          throw new Error('Cannot find transaction path for executing action')
        }

        const estimatedGas = await web3.eth.estimateGas(ctx.transactionPath[0])
        tx.gas = parseInt(GAS_ESTIMATE_ERROR_FACTOR * estimatedGas)
        return new Promise((resolve, reject) => {
          web3.eth.sendTransaction(ctx.transactionPath[0],(err,res) => {
            if(err){
              reject(err)
              return
            }
            ctx.res = res
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
