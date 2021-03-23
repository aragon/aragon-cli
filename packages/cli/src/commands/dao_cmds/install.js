import TaskList from 'listr'
import { blue, green, bold } from 'chalk'
import { hash as namehash } from 'eth-ens-namehash'
import { connect } from '@aragon/connect'
import {
  ANY_ENTITY,
  NO_MANAGER,
  ZERO_ADDRESS,
  addressesEqual,
  resolveAddressOrEnsDomain,
  getAclAddress,
  encodeInitPayload,
  getAppProxyAddressFromReceipt,
  getAppBase,
  defaultAPMName,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
  isLocalDaemonRunning,
  getApmRepo,
  userHasCreatePermission,
  hasAppManagerPermission,
} from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'
import listrOpts from '../../helpers/listr-options'
import { task as execTask } from './utils/execHandler'
import daoArg from './utils/daoArg'

export const command = 'install <dao> <apmRepo> [apmRepoVersion]'
export const describe = 'Install an app into a DAO'

export const builder = function (yargs) {
  return daoArg(yargs)
    .option('apmRepo', {
      describe: 'Name of the aragonPM repo',
    })
    .option('apmRepoVersion', {
      describe: 'Version of the package upgrading to',
      default: 'latest',
    })
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

export const handler = async function ({
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

  const apmRepoName = defaultAPMName(apmRepo)
  dao = await resolveAddressOrEnsDomain(
    dao,
    web3,
    apmOptions.ensRegistryAddress
  )

  const accounts = await web3.eth.getAccounts()
  const userAddress = accounts[0]
  if (!userAddress) throw Error(`Error getting accounts from web3`)

  // Verify that user has permissions to install
  if (!(await userHasCreatePermission(dao, userAddress, web3)))
    throw Error(
      `This address ${userAddress} does not have permission to install ${apmRepoName}`
    )

  const progressHandler = (step) => {
    switch (step) {
      case 1:
        console.log(`Initialize aragonPM`)
        break
      case 2:
        console.log(`Fetching...`)
        break
    }
  }

  const tasks = new TaskList(
    [
      {
        title: 'Start IPFS',
        skip: async () => isLocalDaemonRunning(),
        task: async () => {
          await startLocalDaemon(getBinaryPath(), getDefaultRepoPath(), {
            detached: false,
          })
        },
      },
      {
        title: `Fetching ${bold(apmRepoName)}@${apmRepoVersion}`,
        task: async (ctx) => {
          ctx.repo = await getApmRepo(
            web3,
            apmRepoName,
            apmOptions,
            apmRepoVersion,
            progressHandler
          )
        },
      },
      {
        title: `Fetching App Manager permissions`,
        task: async (ctx, task) => {
          const org = await connect(dao, 'thegraph', {
            chainId: network.network_id,
          })
          const votingName = namehash('voting.aragonpm.eth')
          const installedVoting = (await org.apps()).find(
            (app) => app.appId === votingName
          ).address

          if (installedVoting !== ZERO_ADDRESS) {
            ctx.managedByVoting = await hasAppManagerPermission(
              dao,
              installedVoting,
              web3
            )
          } else {
            ctx.managedByVoting = false
          }
        },
      },
      {
        title: `Checking installed version`,
        task: async (ctx, task) => {
          const currentBase = await getAppBase(dao, ctx.repo.appId, web3)
          if (currentBase === ZERO_ADDRESS) {
            task.skip(`Installing the first instance of ${apmRepoName} in DAO`)
            return
          }
          if (!addressesEqual(currentBase, ctx.repo.contractAddress)) {
            throw new Error(
              `Cannot install app on a different version. Currently installed version for ${apmRepoName} in the DAO is ${currentBase}\n Please upgrade using 'dao upgrade' first or install a different version.`
            )
          }
        },
      },
      {
        title: 'Deploying app instance',
        task: async (ctx) => {
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
            method: 'newAppInstance(bytes32,address,bytes,bool)', // Use signature, method is overloaded
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
        enabled: (ctx) => setPermissions === 'open' && ctx.appAddress,
        task: async (ctx, task) => {
          if (!ctx.repo.roles || ctx.repo.roles.length === 0) {
            throw new Error(
              'You have no roles defined in your arapp.json.\nThis is required for your app to be properly installed.\nSee https://hack.aragon.org/docs/cli-global-confg#the-arappjson-file for more information.'
            )
          }

          const permissions = ctx.repo.roles.map((role) => [
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
            permissions.map((params) => {
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
                  .then((tasks) => tasks.run())
              )
            })
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks.run().then((ctx) => {
    reporter.newLine()
    reporter.info(
      `Successfully executed: "${blue(ctx.transactionPath.description)}"`
    )
    reporter.newLine()
    if (ctx.appAddress) {
      reporter.success(
        `Installed ${blue(apmRepoName)} at: ${green(ctx.appAddress)}`
      )
    } else {
      reporter.warning(
        'After the app instance is created, you will need to assign permissions to it for it appear as an app in the DAO.'
      )
    }

    if (ctx.managedByVoting) {
      reporter.newLine()
      reporter.info(
        'A new vote has been created in your Voting app to complete the installation.'
      )
    }

    if (ctx.notInitialized) {
      reporter.newLine()
      reporter.warning(
        'The app could not be initialized, check the --app-init flag. Functions protected behind the ACL will not work until the app is initialized.'
      )
    }
  })
}
