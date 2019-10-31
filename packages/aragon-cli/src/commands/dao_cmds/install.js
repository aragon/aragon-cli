const execTask = require('./utils/execHandler').task
const { resolveEnsDomain } = require('../../helpers/aragonjs-wrapper')
const TaskList = require('listr')
const daoArg = require('./utils/daoArg')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('@aragon/cli-utils/src/helpers/default-apm')
const chalk = require('chalk')
const startIPFS = require('../ipfs_cmds/start')
const getRepoTask = require('./utils/getRepoTask')
const encodeInitPayload = require('./utils/encodeInitPayload')
const {
  addressesEqual,
  ANY_ENTITY,
  NO_MANAGER,
  ZERO_ADDRESS,
} = require('../../util')
const kernelAbi = require('@aragon/os/build/contracts/Kernel').abi
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')

exports.command = 'install <dao> <apmRepo> [apmRepoVersion]'

exports.describe = 'Install an app into a DAO'

exports.builder = function(yargs) {
  return getRepoTask
    .args(daoArg(yargs))
    .option('app-init', {
      description:
        'Name of the function that will be called to initialize an app. Set it to "none" to skip initialization',
      default: 'initialize',
    })
    .option('app-init-args', {
      description: 'Arguments for calling the app init function',
      array: true,
      default: [],
    })
    .options('set-permissions', {
      description:
        'Whether to set permissions in the app. Set it to "open" to allow ANY_ENTITY on all roles.',
      choices: ['open'],
    })
}

exports.task = async ({
  wsProvider,
  web3,
  reporter,
  dao,
  gasPrice,
  network,
  apmOptions,
  apmRepo,
  apmRepoVersion,
  appInit,
  appInitArgs,
  setPermissions,
  silent,
  debug,
}) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)

  dao = /0x[a-fA-F0-9]{40}/.test(dao)
    ? dao
    : await resolveEnsDomain(dao, {
        provider: web3.currentProvider,
        registryAddress: apmOptions.ensRegistryAddress,
      })

  const kernel = new web3.eth.Contract(kernelAbi, dao)

  const tasks = new TaskList(
    [
      {
        // IPFS is a dependency of getRepoTask which uses IPFS to fetch the contract ABI
        title: 'Check IPFS',
        task: () => startIPFS.task({ apmOptions }),
      },
      {
        title: `Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`,
        task: getRepoTask.task({ apm, apmRepo, apmRepoVersion }),
      },
      {
        title: `Checking installed version`,
        task: async (ctx, task) => {
          const basesNamespace = await kernel.methods
            .APP_BASES_NAMESPACE()
            .call()
          const currentBase = await kernel.methods
            .getApp(basesNamespace, ctx.repo.appId)
            .call()
          if (currentBase === ZERO_ADDRESS) {
            task.skip(`Installing the first instance of ${apmRepo} in DAO`)
            return
          }
          if (!addressesEqual(currentBase, ctx.repo.contractAddress)) {
            throw new Error(
              `Cannot install app on a different version. Currently installed version for ${apmRepo} in the DAO is ${currentBase}\n Please upgrade using 'dao upgrade' first or install a different version.`
            )
          }
        },
      },
      {
        title: 'Deploying app instance',
        task: async ctx => {
          const initPayload = encodeInitPayload(
            web3,
            ctx.repo.abi,
            appInit,
            appInitArgs
          )

          if (initPayload === '0x') {
            ctx.notInitialized = true
          }

          const fnArgs = [
            ctx.repo.appId,
            ctx.repo.contractAddress,
            initPayload,
            false,
          ]

          return execTask({
            dao,
            app: dao,
            method: 'newAppInstance',
            params: fnArgs,
            ipfsCheck: false,
            reporter,
            gasPrice,
            apm: apmOptions,
            web3,
            wsProvider,
            silent,
            debug,
          })
        },
      },
      {
        title: 'Fetching deployed app',
        task: async (ctx, task) => {
          const logABI = kernelAbi.find(
            ({ type, name }) => type === 'event' && name === 'NewAppProxy'
          )
          if (!logABI) {
            throw new Error(
              'Kernel ABI in aragon.js doesnt contain NewAppProxy log'
            )
          }
          const logSignature = `${logABI.name}(${logABI.inputs
            .map(i => i.type)
            .join(',')})`
          const logTopic = web3.utils.sha3(logSignature)
          const deployLog = ctx.receipt.logs.find(({ topics, address }) => {
            return topics[0] === logTopic && addressesEqual(dao, address)
          })

          if (!deployLog) {
            task.skip("App wasn't deployed in transaction.")
            return
          }

          const log = web3.eth.abi.decodeLog(logABI.inputs, deployLog.data)
          ctx.appAddress = log.proxy
        },
      },
      {
        title: 'Set permissions',
        enabled: ctx => setPermissions === 'open' && ctx.appAddress,
        task: async (ctx, task) => {
          if (!ctx.repo.roles || ctx.repo.roles.length === 0) {
            throw new Error(
              'You have no roles defined in your arapp.json.\nThis is required for your app to be properly installed.\nSee https://hack.aragon.org/docs/cli-global-confg#the-arappjson-file for more information.'
            )
          }

          const permissions = ctx.repo.roles.map(role => [
            ANY_ENTITY,
            ctx.appAddress,
            role.bytes,
            NO_MANAGER,
          ])

          if (!ctx.accounts) {
            ctx.accounts = await web3.eth.getAccounts()
          }
          const daoInstance = new web3.eth.Contract(
            require('./abi/os/Kernel').abi,
            dao
          )
          const aclAddress = await daoInstance.methods.acl().call()

          return Promise.all(
            permissions.map(params => {
              return (
                execTask({
                  dao,
                  app: aclAddress,
                  method: 'createPermission',
                  params,
                  reporter,
                  gasPrice,
                  apm: apmOptions,
                  web3,
                  wsProvider,
                  silent,
                  debug,
                })
                  // execTask returns a TaskList not a promise
                  .then(tasks => tasks.run())
              )
            })
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
}

exports.handler = async function({
  reporter,
  dao,
  gasPrice,
  network,
  apm: apmOptions,
  apmRepo,
  apmRepoVersion,
  appInit,
  appInitArgs,
  setPermissions,
  wsProvider,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)
  const task = await exports.task({
    web3,
    reporter,
    dao,
    gasPrice,
    network,
    apmOptions,
    apmRepo,
    apmRepoVersion,
    appInit,
    appInitArgs,
    setPermissions,
    wsProvider,
    silent,
    debug,
  })

  return task.run().then(ctx => {
    reporter.info(
      `Successfully executed: "${chalk.blue(
        ctx.transactionPath[0].description
      )}"`
    )

    if (ctx.appAddress) {
      reporter.success(
        `Installed ${chalk.blue(apmRepo)} at: ${chalk.green(ctx.appAddress)}`
      )
    } else {
      reporter.warning(
        'After the app instance is created, you will need to assign permissions to it for it appear as an app in the DAO'
      )
    }

    if (ctx.notInitialized) {
      reporter.warning(
        'App could not be initialized, check the --app-init flag. Functions protected behind the ACL will not work until the app is initialized'
      )
    }

    process.exit()
  })
}
