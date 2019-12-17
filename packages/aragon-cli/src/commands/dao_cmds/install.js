import TaskList from 'listr'
import { blue, green, bold } from 'chalk'
import APM from '@aragon/apm'
import {
  ANY_ENTITY,
  NO_MANAGER,
  ZERO_ADDRESS,
  addressesEqual,
  resolveAddressOrEnsDomain,
  getAclAddress,
  getAppProxyAddressFromReceipt,
  getAppBase,
} from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'
import listrOpts from '../../helpers/listr-options'
import defaultAPMName from '../../helpers/default-apm'
import encodeInitPayload from '../../helpers/encodeInitPayload'
import { task as execTask } from './utils/execHandler'
import { task as getRepoTask, args } from './utils/getRepoTask'
import daoArg from './utils/daoArg'

export const command = 'install <dao> <apmRepo> [apmRepoVersion]'
export const describe = 'Install an app into a DAO'

export const builder = function(yargs) {
  return args(daoArg(yargs))
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

export const handler = async function({
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

  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  dao = await resolveAddressOrEnsDomain(dao, web3, apmOptions['ens-registry'])

  const tasks = new TaskList(
    [
      {
        title: `Fetching ${bold(apmRepo)}@${apmRepoVersion}`,
        task: await getRepoTask({ apm, apmRepo, apmRepoVersion }),
      },
      {
        title: `Checking installed version`,
        task: async (ctx, task) => {
          const currentBase = await getAppBase(dao, ctx.repo.appId, web3)
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
          const appAddress = getAppProxyAddressFromReceipt(dao, ctx.receipt)
          if (appAddress) ctx.appAddress = appAddress
          else task.skip("App wasn't deployed in transaction.")
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

          const aclAddress = await getAclAddress(dao, web3)

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

  return tasks.run().then(ctx => {
    reporter.newLine()
    reporter.info(
      `Successfully executed: "${blue(ctx.transactionPath.description)}"`
    )
    reporter.newLine()
    if (ctx.appAddress) {
      reporter.success(
        `Installed ${blue(apmRepo)} at: ${green(ctx.appAddress)}`
      )
    } else {
      reporter.warning(
        'After the app instance is created, you will need to assign permissions to it for it appear as an app in the DAO'
      )
    }

    if (ctx.notInitialized) {
      reporter.newLine()
      reporter.warning(
        'App could not be initialized, check the --app-init flag. Functions protected behind the ACL will not work until the app is initialized'
      )
    }
  })
}
