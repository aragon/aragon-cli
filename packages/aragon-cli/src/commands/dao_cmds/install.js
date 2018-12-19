const execTask = require('./utils/execHandler').task
const { resolveEnsDomain } = require('./utils/aragonjs-wrapper')
const TaskList = require('listr')
const daoArg = require('./utils/daoArg')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')
const chalk = require('chalk')
const getRepoTask = require('./utils/getRepoTask')
const encodeInitPayload = require('./utils/encodeInitPayload')
const { getContract, ANY_ENTITY, NO_MANAGER } = require('../../util')
const kernelABI = require('@aragon/wrapper/abi/aragon/Kernel')
const listrOpts = require('../../helpers/listr-options')

const addressesEqual = (a, b) => a.toLowerCase() === b.toLowerCase()
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const setPermissionsWithoutTransactionPathing = async (
  web3,
  sender,
  aclAddress,
  permissions
) => {
  const acl = new web3.eth.Contract(
    getContract('@aragon/os', 'ACL').abi,
    aclAddress
  )
  return Promise.all(
    permissions.map(([who, where, what, manager]) =>
      acl.methods.createPermission(who, where, what, manager).send({
        from: sender,
        gasLimit: 1e6,
      })
    )
  )
}

exports.command = 'install <dao> <apmRepo> [apmRepoVersion]'

exports.describe = 'Install an app into a DAO'

exports.builder = function(yargs) {
  return getRepoTask
    .args(daoArg(yargs))
    .option('app-init', {
      description:
        'Name of the function that will be called to initialize an app',
      default: 'initialize',
    })
    .option('app-init-args', {
      description: 'Arguments for calling the app init function',
      array: true,
      default: [],
    })
    .options('set-permissions', {
      description: 'Whether to set permissions in the app',
      boolean: true,
      default: true,
    })
}

exports.task = async ({
  wsProvider,
  web3,
  reporter,
  dao,
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

  const kernel = new web3.eth.Contract(
    getContract('@aragon/os', 'Kernel').abi,
    dao
  )

  const tasks = new TaskList(
    [
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
          if (currentBase === ZERO_ADDR) {
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

          const getTransactionPath = wrapper => {
            const fnArgs = [
              ctx.repo.appId,
              ctx.repo.contractAddress,
              initPayload,
              false,
            ]
            return wrapper.getTransactionPath(dao, 'newAppInstance', fnArgs)
          }

          return execTask(dao, getTransactionPath, {
            reporter,
            apm: apmOptions,
            web3,
            wsProvider,
          })
        },
      },
      {
        title: 'Fetching deployed app',
        enabled: () => setPermissions,
        task: async (ctx, task) => {
          const logABI = kernelABI.find(
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
        enabled: ctx => setPermissions && ctx.appAddress,
        task: async (ctx, task) => {
          const aclAddress = await kernel.methods.acl().call()

          if (!ctx.repo.roles || ctx.repo.roles.length === 0) {
            throw new Error(
              'You have no permissions defined in your arapp.json\nThis is required for your app to properly show up.'
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

          // TODO: setPermissions should use ACL functions with transaction pathing
          return setPermissionsWithoutTransactionPathing(
            web3,
            ctx.accounts[0],
            aclAddress,
            permissions
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
      `Successfully executed: "${ctx.transactionPath[0].description}"`
    )

    if (ctx.appAddress) {
      reporter.success(`Installed ${apmRepo} at: ${chalk.bold(ctx.appAddress)}`)
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
