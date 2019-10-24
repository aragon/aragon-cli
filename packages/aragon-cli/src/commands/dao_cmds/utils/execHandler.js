import initAragonJS from './aragonjs-wrapper'
const chalk = require('chalk')
const startIPFS = require('../../ipfs_cmds/start')
const TaskList = require('listr')
const { ensureWeb3 } = require('../../../helpers/web3-fallback')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const { addressesEqual } = require('../../../util')
const { map, filter, first } = require('rxjs/operators')

/**
 * Get transaction path
 * @param {string} appAddress App address
 * @param {string} method Method name
 * @param {Object} params Method params
 * @param {Object} wrapper Aragon wrapper
 */
async function getTransactionPath(appAddress, method, params, wrapper) {
  // Wait for app info to load
  await wrapper.apps
    .pipe(
      map(apps => apps.find(app => addressesEqual(appAddress, app.proxyAddress))),
      filter(app => app),
      first()
    )
    .toPromise()

  // If app is the ACL, call getACLTransactionPath
  return appAddress === wrapper.aclProxy.address
    ? wrapper.getACLTransactionPath(method, params)
    : wrapper.getTransactionPath(appAddress, method, params)
}

exports.task = async function(
  {
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
  }
) {
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

          return new Promise((resolve, reject) => {
            let wrapper, appsLoaded

            const tryFindTransactionPath = async () => {
              if (appsLoaded && wrapper && !ctx.transactionPath) {
                try {
                  ctx.transactionPath = await getTransactionPath(
                    app,
                    method,
                    params,
                    wrapper
                  )
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

exports.handler = async function(args) {
  args = {
    ...args,
    web3: await ensureWeb3(args.network),
  }

  const tasks = await exports.task(args)

  return tasks.run().then(ctx => {
    args.reporter.success(
      `Successfully executed: "${chalk.blue(
        ctx.transactionPath[0].description
      )}"`
    )
    process.exit()
  })
}
