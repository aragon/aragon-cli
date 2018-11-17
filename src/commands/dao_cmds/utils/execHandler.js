import initAragonJS from './aragonjs-wrapper'
const TaskList = require('listr')
const { ensureWeb3 } = require('../../../helpers/web3-fallback')
const listrOpts = require('../../../helpers/listr-options')

const GAS_ESTIMATE_FUZZ_FACTOR = 2

module.exports = async function (dao, getTransactionPath, { reporter, apm, network, silent, debug }) {
  const web3 = await ensureWeb3(network)

  const tasks = new TaskList([
    {
      title: 'Generating transaction',
      task: async (ctx, task) => {
        task.output = `Fetching DAO at ${dao}...`

        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

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
      title: `Sending transaction`,
      task: async (ctx, task) => {
        task.output = `Waiting for response...`
        let tx = ctx.transactionPath[0] // TODO: Support choosing between possible transaction paths

        if (!tx) {
          throw new Error('Cannot find transaction path for executing action')
        }

        const estimatedGas = await web3.eth.estimateGas(ctx.transactionPath[0])
        tx.gas = parseInt(GAS_ESTIMATE_FUZZ_FACTOR * estimatedGas)
        return new Promise((resolve, reject) => {
          web3.eth.sendTransaction(ctx.transactionPath[0], (err, res) => {
            if (err) {
              reject(err)
              return
            }
            ctx.res = res
            resolve()
          })
        })
      }
    }
  ],
    listrOpts(silent, debug)
  )

  return tasks.run()
    .then((ctx) => {
      reporter.success(`Successfully sent executed action starting with transaction: ` + JSON.stringify(ctx.transactionPath[0].description))
      process.exit()
    })
}
