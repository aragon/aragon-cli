import initAragonJS from './aragonjs-wrapper'
const chalk = require('chalk')
const TaskList = require('listr')
const { ensureWeb3 } = require('@aragon/cli-utils/src/helpers/web3-fallback')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')

exports.task = async function(
  dao,
  getTransactionPath,
  { reporter, apm, web3, wsProvider, gasPrice, silent, debug }
) {
  const accounts = await web3.eth.getAccounts()
  return new TaskList(
    [
      {
        title: 'Generating transaction',
        task: async (ctx, task) => {
          task.output = `Fetching DAO at ${dao}...`

          return new Promise((resolve, reject) => {
            let wrapper, appsLoaded

            const tryFindTransactionPath = async () => {
              if (appsLoaded && wrapper) {
                try {
                  ctx.transactionPath = await getTransactionPath(wrapper)
                  resolve()
                } catch (e) {
                  reject(e)
                }
              }
            }

            initAragonJS(dao, apm['ens-registry'], {
              ipfsConf: apm.ipfs,
              gasPrice,
              provider: wsProvider || web3.currentProvider,
              accounts,
              onApps: async apps => {
                appsLoaded = true
                await tryFindTransactionPath()
              },
              onError: err => reject(err),
            })
              .then(async initializedWrapper => {
                wrapper = initializedWrapper
                await tryFindTransactionPath()
              })
              .catch(err => {
                reporter.error('Error inspecting DAO')
                reporter.debug(err)
                process.exit(1)
              })
          })
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

exports.handler = async function(dao, getTransactionPath, args) {
  args = {
    ...args,
    web3: await ensureWeb3(args.network),
  }

  const tasks = await exports.task(dao, getTransactionPath, args)

  return tasks.run().then(ctx => {
    args.reporter.success(
      `Successfully executed: "${chalk.blue(
        ctx.transactionPath[0].description
      )}"`
    )
    process.exit()
  })
}
