const TaskList = require('listr')
const daoArg = require('./utils/daoArg')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')
const chalk = require('chalk')
const getRepoTask = require('./utils/getRepoTask')
const encodeInitPayload = require('./utils/encodeInitPayload')
const upgrade = require('./upgrade')
const { getContract, ANY_ENTITY } = require('../../util')
const listrOpts = require('../../helpers/listr-options')

const setPermissions = async (web3, sender, aclAddress, permissions) => {
  const acl = new web3.eth.Contract(
    getContract('@aragon/os', 'ACL').abi,
    aclAddress
  )
  return Promise.all(
    permissions.map(([who, where, what]) =>
      acl.methods.createPermission(who, where, what, who).send({
        from: sender,
        gasLimit: 1e6
      })
    )
  )
}

exports.command = 'install <dao> <apmRepo> [apmRepoVersion]'

exports.describe = 'Install an app into a DAO'

exports.builder = function (yargs) {
  return getRepoTask.args(daoArg(yargs))
    .option('app-init', {
      description: 'Name of the function that will be called to initialize an app',
      default: 'initialize'
    }).option('app-init-args', {
      description: 'Arguments for calling the app init function',
      array: true,
      default: []
    })
}

exports.task = async ({ web3, reporter, dao, network, apmOptions, apmRepo, apmRepoVersion, appInit, appInitArgs, silent, debug }) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  // TODO: Resolve DAO ens name

  const tasks = new TaskList([
    {
      title: `Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`,
      task: getRepoTask.task({ apm, apmRepo, apmRepoVersion })
    },
    {
      title: `Upgrading app`,
      task: ctx => upgrade.task({ repo: ctx.repo, web3, dao, apmRepo, apmRepoVersion, apmOptions, reporter })
    },
    {
      title: 'Deploying app instance',
      task: async (ctx) => {
        const kernel = new web3.eth.Contract(
          getContract('@aragon/os', 'Kernel').abi,
          dao
        )

        ctx.aclAddress = await kernel.methods.acl().call()
        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

        // TODO: report if empty
        const initPayload = encodeInitPayload(web3, ctx.repo.abi, appInit, appInitArgs)

        if (initPayload === '0x') {
          ctx.notInitialized = true
        }

        const { events } = await kernel.methods.newAppInstance(
          ctx.repo.appId,
          ctx.repo.contractAddress,
          initPayload,
          false
        ).send({
          from: ctx.accounts[0],
          gasLimit: 1e6
        })

        ctx.appAddress = events['NewAppProxy'].returnValues.proxy
      }
    },
    {
      title: 'Set permissions',
      task: async (ctx, task) => {
        if (!ctx.repo.roles || ctx.repo.roles.length === 0) {
          throw new Error('You have no permissions defined in your arapp.json\nThis is required for your app to properly show up.')
        }

        const permissions = ctx.repo.roles
          .map((role) => [ANY_ENTITY, ctx.appAddress, role.bytes])

        return setPermissions(
          web3,
          ctx.accounts[0],
          ctx.aclAddress,
          permissions
        )
      }
    }
  ],
    listrOpts(silent, debug)
  )

  return tasks
}

exports.handler = async function ({ reporter, dao, network, apm: apmOptions, apmRepo, apmRepoVersion, appInit, appInitArgs, silent, debug }) {
  const web3 = await ensureWeb3(network)

  const task = await exports.task({ web3, reporter, dao, network, apmOptions, apmRepo, apmRepoVersion, appInit, appInitArgs, silent, debug })
  return task.run()
    .then((ctx) => {
      reporter.success(`Installed ${apmRepo} at: ${chalk.bold(ctx.appAddress)}`)

      if (ctx.notInitialized) {
        reporter.warning('App could not be initialized, check the --app-init flag. Functions protected behind the ACL will not work until the app is initialized')
      }

      process.exit()
    })
}
