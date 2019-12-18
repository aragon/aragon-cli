import TaskList from 'listr'
import path from 'path'
import fs from 'fs-extra'
import url from 'url'
// TODO: stop using web3
import Web3 from 'web3'
import APM from '@aragon/apm'
import { blue, green, bold } from 'chalk'
import { isPortTaken } from '@aragon/toolkit'
//
import encodeInitPayload from '../helpers/encodeInitPayload'
import listrOpts from '../helpers/listr-options'
import { task as getRepoTask } from './dao_cmds/utils/getRepoTask'
import pkg from '../../package.json'
import {
  findProjectRoot,
  isHttpServerOpen,
  parseArgumentStringIfPossible,
} from '../util'

// cmds
import {
  devchainTask,
  printAccounts,
  printMnemonic,
  printResetNotice,
} from './devchain_cmds/start'

import { task as startTask } from './start'
import { arappContract, task as deployTask } from './deploy'
import {
  task as newDAOTask,
  BARE_TEMPLATE,
  BARE_INSTANCE_FUNCTION,
  BARE_TEMPLATE_DEPLOY_EVENT,
} from './dao_cmds/new'
import {
  runSetupTask,
  runPrepareForPublishTask,
  runPublishTask,
} from './apm_cmds/publish'

const DEFAULT_CLIENT_REPO = pkg.aragon.clientRepo
const DEFAULT_CLIENT_VERSION = pkg.aragon.clientVersion
const DEFAULT_CLIENT_PORT = pkg.aragon.clientPort

export const command = 'run'
export const describe = 'Run the current app locally'

export const builder = function(yargs) {
  return yargs
    .option('client', {
      description: 'Just run the smart contracts, without the Aragon client',
      default: true,
      boolean: true,
    })
    .option('files', {
      description:
        'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
      default: ['.'],
      array: true,
    })
    .option('port', {
      description: 'Port to start devchain at',
      default: '8545',
    })
    .option('network-id', {
      description: 'Network id to connect with',
    })
    .option('block-time', {
      description: 'Specify blockTime in seconds for automatic mining',
    })
    .option('accounts', {
      default: 2,
      description: 'Number of accounts to print',
    })
    .option('reset', {
      default: false,
      boolean: true,
      description: 'Reset devchain to snapshot',
    })
    .option('template', {
      default: BARE_TEMPLATE,
      description: 'Template contract name',
    })
    .option('template-init', {
      description: 'Arguments to be passed to the template constructor',
      array: true,
      default: [],
    })
    .option('template-deploy-event', {
      description: 'Event name that the template will fire on success',
      default: BARE_TEMPLATE_DEPLOY_EVENT,
    })
    .option('template-new-instance', {
      description: 'Function to be called to create template instance',
      default: BARE_INSTANCE_FUNCTION,
    })
    .option('template-args', {
      description:
        'Arguments to be passed to the function specified in --template-new-instance',
      array: true,
      default: [],
      coerce: args => {
        return args.map(parseArgumentStringIfPossible)
      },
    })
    .option('build', {
      description:
        'Whether publish should try to build the app before publishing, running the script specified in --build-script',
      default: true,
      boolean: true,
    })
    .option('build-script', {
      description: 'The npm script that will be run when building the app',
      default: 'build',
    })
    .option('publish-dir', {
      description:
        'Temporary directory where files will be copied before publishing. Defaults to temp dir.',
      default: null,
    })
    .option('prepublish', {
      description:
        'Whether publish should run prepublish script specified in --prepublish-script before publishing',
      default: false,
      boolean: true,
    })
    .option('prepublish-script', {
      description: 'The npm script that will be run before publishing the app',
      default: 'prepublishOnly',
    })
    .option('bump', {
      description:
        'Type of bump (major, minor or patch) or version number to publish the app',
      type: 'string',
      default: 'major',
    })
    .option('http', {
      description: 'URL for where your app is served from e.g. localhost:1234',
      default: null,
      coerce: url => {
        return url && url.substr(0, 7) !== 'http://' ? `http://${url}` : url
      },
    })
    .option('http-served-from', {
      description:
        'Directory where your files is being served from e.g. ./dist',
      default: null,
    })
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
    .option('client-repo', {
      description: 'Repo of Aragon client used to run your sandboxed app',
      default: DEFAULT_CLIENT_REPO,
    })
    .option('client-version', {
      description: 'Version of Aragon client used to run your sandboxed app',
      default: DEFAULT_CLIENT_VERSION,
    })
    .option('client-port', {
      description: 'Port being used by Aragon client',
      default: DEFAULT_CLIENT_PORT,
    })
    .option('client-path', {
      description: 'A path pointing to an existing Aragon client installation',
      default: null,
    })
}

export const handler = async function({
  // Globals
  reporter,
  gasPrice,
  cwd,
  apm: apmOptions,
  silent,
  debug,
  network,
  module,
  client,
  files,
  port,
  networkId,
  blockTime,
  accounts,
  reset,
  template,
  templateInit,
  templateDeployEvent,
  templateNewInstance,
  templateArgs,
  build,
  buildScript,
  publishDir,
  prepublish,
  prepublishScript,
  bump,
  http,
  httpServedFrom,
  appInit,
  appInitArgs,
  clientRepo,
  clientVersion,
  clientPort,
  clientPath,
}) {
  if (http && !(await isHttpServerOpen(http))) {
    throw Error(
      `Can't connect to ${http}, make sure the http server is running.`
    )
  }

  const showAccounts = accounts

  const tasks = new TaskList(
    [
      {
        title: 'Start a local Ethereum network',
        skip: async ctx => {
          const hostURL = new url.URL(network.provider.connection._url)
          if (!(await isPortTaken(hostURL.port))) {
            return false
          } else {
            ctx.web3 = new Web3(network.provider)
            ctx.accounts = await ctx.web3.eth.getAccounts()
            return 'Connected to the provided Ethereum network'
          }
        },
        task: async (ctx, task) =>
          devchainTask({ port, networkId, blockTime, reset, showAccounts }),
      },
      {
        title: 'Setup before publish',
        task: async ctx => {
          ctx.publishParams = {
            provider: 'ipfs',
            files,
            ignore: ['node_modules'],
            reporter,
            debug,
            silent,
            gasPrice,
            cwd,
            network,
            module,
            buildScript,
            build,
            publishDir,
            prepublishScript,
            prepublish,
            contract: arappContract(),
            web3: ctx.web3,
            apm: apmOptions,
            bump,
            http,
            httpServedFrom,
          }

          return runSetupTask(ctx.publishParams)
        },
      },
      {
        title: 'Prepare for publish',
        task: async ctx =>
          runPrepareForPublishTask({
            ...ctx.publishParams,
            // context
            initialRepo: ctx.initialRepo,
            initialVersion: ctx.initialVersion,
            version: ctx.version,
            contractAddress: ctx.contract,
            deployArtifacts: ctx.deployArtifacts,
          }),
      },
      {
        title: 'Publish app to aragonPM',
        task: async ctx => {
          const { dao, proxyAddress, methodName, params } = ctx.intent

          return runPublishTask({
            ...ctx.publishParams,
            // context
            dao,
            proxyAddress,
            methodName,
            params,
          })
        },
      },
      {
        title: 'Fetch published repo',
        task: async ctx => {
          // getRepoTask.task() return a function with ctx argument
          await getRepoTask({
            apmRepo: module.appName,
            apm: APM(ctx.web3, apmOptions),
            artifactRequired: false,
          })(ctx)
        },
      },
      {
        title: 'Deploy Template',
        enabled: () => template !== BARE_TEMPLATE,
        task: ctx => {
          const deployParams = {
            module,
            contract: template,
            init: templateInit,
            reporter,
            gasPrice,
            network,
            cwd,
            web3: ctx.web3,
            apmOptions,
          }

          return deployTask(deployParams)
        },
      },
      {
        title: 'Create Organization',
        task: ctx => {
          const roles = ctx.repo.roles || []
          const rolesBytes = roles.map(role => role.bytes)

          let fnArgs

          if (ctx.contractInstance) {
            // If template was deployed, use template args
            fnArgs = templateArgs
          } else {
            // TODO: Report warning when app wasn't initialized
            const initPayload = encodeInitPayload(
              ctx.web3,
              ctx.repo.abi,
              appInit,
              appInitArgs
            )

            if (initPayload === '0x') {
              ctx.notInitialized = true
            }

            fnArgs = [ctx.repo.appId, rolesBytes, ctx.accounts[0], initPayload]
          }

          const newDAOParams = {
            template,
            templateVersion: 'latest',
            templateInstance: ctx.contractInstance,
            fn: templateNewInstance,
            fnArgs,
            deployEvent: templateDeployEvent,
            gasPrice,
            web3: ctx.web3,
            reporter,
            apmOptions,
          }

          return newDAOTask(newDAOParams)
        },
      },
      {
        title: 'Start Client',
        enabled: () => client === true,
        task: async (ctx, task) =>
          startTask({ clientRepo, clientVersion, clientPort, clientPath }),
      },
    ],
    listrOpts(silent, debug)
  )

  const manifestPath = path.resolve(findProjectRoot(), 'manifest.json')
  let manifest
  if (fs.existsSync(manifestPath)) {
    manifest = fs.readJsonSync(manifestPath)
  }

  return tasks.run({ ens: apmOptions.ensRegistryAddress }).then(async ctx => {
    if (ctx.portOpen) {
      reporter.warning(
        `Server already listening at port ${blue(
          clientPort
        )}, skipped starting Aragon`
      )
    }

    if (ctx.notInitialized) {
      reporter.warning(
        'App could not be initialized, check the --app-init flag. Functions protected behind the ACL will not work until the app is initialized'
      )
    }

    if (files.length === 1 && path.normalize(files[0]) === '.') {
      reporter.warning(
        `Publishing files from the project's root folder is not recommended. Consider using the distribution folder of your project: "--files <folder>".`
      )
    }

    reporter.newLine()

    reporter.info(`You are now ready to open your app in Aragon.`)

    reporter.newLine()

    if (ctx.privateKeys) {
      printAccounts(reporter, ctx.privateKeys)
    }

    if (ctx.mnemonic) {
      printMnemonic(reporter, ctx.mnemonic)
    }

    printResetNotice(reporter, reset)

    const registry = module.appName
      .split('.')
      .slice(1)
      .join('.')

    reporter.info(`This is the configuration for your development deployment:
    ${'Ethereum Node'}: ${blue(network.provider.connection._url)}
    ${'ENS registry'}: ${blue(ctx.ens)}
    ${`aragonPM registry`}: ${blue(registry)}
    ${'Organization address'}: ${green(ctx.daoAddress)}`)

    reporter.newLine()

    reporter.info(
      `${
        client !== false
          ? `Open ${bold(
              `http://localhost:${clientPort}/#/${ctx.daoAddress}`
            )} to view your DAO`
          : `Use ${bold(
              `"aragon dao <command> ${ctx.daoAddress}"`
            )} to interact with your Organization`
      }`
    )

    if (!manifest) {
      reporter.warning('No front-end detected (no manifest.json)')
    } else if (!manifest.start_url) {
      reporter.warning('No front-end detected (no start_url defined)')
    }

    // Patch to prevent calling the onFinishCommand hook
    await new Promise((resolve, reject) => {})
  })
}
