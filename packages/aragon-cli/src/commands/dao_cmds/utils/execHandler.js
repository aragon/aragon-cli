import {
  initAragonJS,
  getTransactionPath,
} from '../../../helpers/aragonjs-wrapper'
const chalk = require('chalk')
const startIPFS = require('../../ipfs_cmds/start')
const TaskList = require('listr')
const { ensureWeb3 } = require('../../../helpers/web3-fallback')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')

/**
 * Return a task list for executing a method on a
 * DAO's app.
 *
 * @param {Object} params Parameters
 * @param {string} params.dao DAO name or address
 * @param {string} params.app App address
 * @param {string} params.method Method name
 * @param {Array<*>} params.params Method parameters
 * @param {boolean} params.ipfsCheck Check if IPFS is running
 * @param {Object} params.reporter Reporter
 * @param {Object} params.apm APM config
 * @param {Object} params.web3 Web3 instance
 * @param {Object} params.wsProvider Ethereum provider
 * @param {string} params.gasPrice Gas price
 * @param {boolean} params.silent Silent task
 * @param {boolean} params.debug Debug mode
 * @returns {Promise<TaskList>} Execution task list
 */
async function task({
  dao,
  app,
  method,
  params,
  ipfsCheck,
  reporter,
  apm,
  web3,
  wsProvider,
  gasPrice,
  silent,
  debug,
}) {
  const accounts = await web3.eth.getAccounts()
  return new TaskList(
    [
      {
        // IPFS is a dependency of getRepoTask which uses IPFS to fetch the contract ABI
        title: 'Check IPFS',
        task: () => startIPFS.task({ apmOptions: apm }),
        enabled: () => ipfsCheck,
      },
      {
        title: 'Generating transaction',
        task: async (ctx, task) => {
          task.output = `Fetching DAO at ${dao}...`

          try {
            const wrapper = await initAragonJS(dao, apm['ens-registry'], {
              ipfsConf: apm.ipfs,
              gasPrice,
              provider: wsProvider || web3.currentProvider,
              accounts,
            })

            ctx.transactionPath = await getTransactionPath(
              app,
              method,
              params,
              wrapper
            )
          } catch (err) {
            reporter.error('Error inspecting DAO')
            reporter.debug(err)
            process.exit(1)
          }
        },
      },
      {
        title: `Sending transaction`,
        task: async (ctx, task) => {
          // aragon.js already calculates the recommended gas
          let tx = ctx.transactionPath[0] // TODO: Support choosing between possible transaction paths

          if (!tx) {
            throw new Error('Cannot find transaction path for executing action')
          }

          task.output = `Waiting for transaction to be mined...`
          ctx.receipt = await web3.eth.sendTransaction(ctx.transactionPath[0])
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

/**
 * Execute a method on a DAO's app.
 *
 * @param {Object} args Parameters
 * @param {string} args.dao DAO name or address
 * @param {string} args.app App address
 * @param {string} args.method Method name
 * @param {Array<*>} args.params Method parameters
 * @param {boolean} args.ipfsCheck Check if IPFS is running
 * @param {Object} args.reporter Reporter
 * @param {Object} args.apm APM config
 * @param {Object} args.web3 Web3 instance
 * @param {Object} args.wsProvider Ethereum provider
 * @param {string} args.gasPrice Gas price
 * @param {boolean} args.silent Silent task
 * @param {boolean} args.debug Debug mode
 * @returns {Promise} Execution promise
 */
async function handler(args) {
  args = {
    ...args,
    web3: await ensureWeb3(args.network),
  }

  const tasks = await task(args)

  return tasks.run().then(ctx => {
    args.reporter.success(
      `Successfully executed: "${chalk.blue(
        ctx.transactionPath[0].description
      )}"`
    )
    process.exit()
  })
}

module.exports = {
  handler,
  task,
}
