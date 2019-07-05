const TaskList = require('listr')
const Web3 = require('web3')
const chalk = require('chalk')
const path = require('path')
const publish = require('./apm_cmds/publish')
const devchain = require('./devchain')
const start = require('./start')
const deploy = require('./deploy')
const newDAO = require('./dao_cmds/new')
const startIPFS = require('./ipfs_cmds/start')
const encodeInitPayload = require('./dao_cmds/utils/encodeInitPayload')
const fs = require('fs-extra')
const pkg = require('../../package.json')
const listrOpts = require('../helpers/listr-options')

const { findProjectRoot, isPortTaken } = require('../util')

const url = require('url')

const DEFAULT_CLIENT_VERSION = pkg.aragon.clientVersion
const DEFAULT_CLIENT_PORT = pkg.aragon.clientPort
// TODO: gasPrice parameter (?)

exports.command = 'run'

exports.describe = 'Run the current app locally'

exports.builder = function(yargs) {
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
    .option('accounts', {
      default: 2,
      description: 'Number of accounts to print',
    })
    .option('reset', {
      default: false,
      boolean: true,
      description: 'Reset devchain to snapshot',
    })
    .option('kit', {
      description: '(deprecated) Kit contract name',
    })
    .option('kit-init', {
      description: '(deprecated) Arguments to be passed to the kit constructor',
      array: true,
    })
    .option('kit-deploy-event', {
      description: '(deprecated) Arguments to be passed to the kit constructor',
    })
    .option('template', {
      default: newDAO.BARE_TEMPLATE,
      description: 'Template contract name',
    })
    .option('template-init', {
      description: 'Arguments to be passed to the template constructor',
      array: true,
      default: [],
    })
    .option('template-deploy-event', {
      description: 'Arguments to be passed to the template constructor',
      default: newDAO.BARE_TEMPLATE_DEPLOY_EVENT,
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
    .option('prepublish', {
      description:
        'Whether publish should run prepublish script specified in --prepublish-script before publishing',
      default: true,
      boolean: true,
    })
    .option('prepublish-script', {
      description: 'The npm script that will be run before publishing the app',
      default: 'prepublish',
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

exports.handler = function({
  // Globals
  reporter,
  cwd,
  apm: apmOptions,
  silent,
  debug,
  network,
  module,
  client,
  files,
  port,
  accounts,
  reset,
  kit,
  kitInit,
  kitDeployEvent,
  template,
  templateInit,
  templateDeployEvent,
  build,
  buildScript,
  prepublish,
  prepublishScript,
  bump,
  http,
  httpServedFrom,
  appInit,
  appInitArgs,
  clientVersion,
  clientPort,
  clientPath,
}) {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  // TODO: this can be cleaned up once kits is no longer supported
  template = kit || template
  templateInit = kitInit || templateInit
  templateDeployEvent = kitDeployEvent || templateDeployEvent

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
        task: async (ctx, task) => devchain.task({ port, reset, showAccounts }),
      },
      {
        title: 'Check IPFS',
        task: () => startIPFS.task({ apmOptions }),
        enabled: () => !http || template,
      },
      {
        title: 'Publish app to aragonPM',
        task: async ctx => {
          const publishParams = {
            provider: 'ipfs',
            files,
            ignore: ['node_modules'],
            reporter,
            cwd,
            network,
            module,
            buildScript,
            build,
            prepublishScript,
            prepublish,
            contract: deploy.arappContract(),
            web3: ctx.web3,
            apm: apmOptions,
            bump,
            http,
            httpServedFrom,
            propagateContet: false,
            skipConfirmation: true,
          }
          // TODO: (Gabi) Prevent propagate content as default
          ctx.repo = await publish.handler(publishParams)
        },
      },
      {
        title: 'Deploy Template',
        enabled: () => template !== newDAO.BARE_TEMPLATE,
        task: ctx => {
          const deployParams = {
            contract: template,
            init: templateInit,
            reporter,
            network,
            cwd,
            web3: ctx.web3,
            apmOptions,
          }

          return deploy.task(deployParams)
        },
      },
      {
        title: 'Create DAO',
        task: ctx => {
          const roles = ctx.repo.roles || []
          const rolesBytes = roles.map(role => role.bytes)

          let fnArgs

          if (ctx.contractInstance) {
            // If no template was deployed, use default params
            fnArgs = []
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
            fn: 'newInstance',
            fnArgs,
            deployEvent: templateDeployEvent,
            web3: ctx.web3,
            reporter,
            apmOptions,
          }

          return newDAO.task(newDAOParams)
        },
      },
      {
        title: 'Open DAO',
        enabled: () => client === true,
        task: async (ctx, task) =>
          start.task({ clientVersion, clientPort, clientPath }),
      },
    ],
    listrOpts(silent, debug)
  )

  const manifestPath = path.resolve(findProjectRoot(), 'manifest.json')
  let manifest
  if (fs.existsSync(manifestPath)) {
    manifest = fs.readJsonSync(manifestPath)
  }

  return tasks.run({ ens: apmOptions['ens-registry'] }).then(async ctx => {
    if (ctx.portOpen) {
      reporter.warning(
        `Server already listening at port ${clientPort}, skipped starting Aragon`
      )
    }

    if (ctx.notInitialized) {
      reporter.warning(
        'App could not be initialized, check the --app-init flag. Functions protected behind the ACL will not work until the app is initialized'
      )
    }

    reporter.info(`You are now ready to open your app in Aragon.`)

    if (ctx.privateKeys) {
      devchain.printAccounts(reporter, ctx.privateKeys)
    }

    if (ctx.mnemonic) {
      devchain.printMnemonic(reporter, ctx.mnemonic)
    }

    devchain.printResetNotice(reporter, reset)

    const registry = module.appName
      .split('.')
      .slice(1)
      .join('.')

    console.log()
    reporter.info(`This is the configuration for your development deployment:
    ${chalk.bold('Ethereum Node')}: ${network.provider.connection._url}
    ${chalk.bold('ENS registry')}: ${ctx.ens}
    ${chalk.bold(`aragonPM registry`)}: ${registry}
    ${chalk.bold('DAO address')}: ${ctx.daoAddress}

    ${
      client !== false
        ? `Opening http://localhost:${clientPort}/#/${ctx.daoAddress} to view your DAO`
        : `Use "aragon dao <command> ${ctx.daoAddress}" to interact with your DAO`
    }`)

    if (!manifest) {
      reporter.warning('No front-end detected (no manifest.json)')
    } else if (!manifest.start_url) {
      reporter.warning('No front-end detected (no start_url defined)')
    }

    if (kit || kitInit || kitDeployEvent) {
      reporter.warning(
        `The use of kits is deprecated and templates should be used instead. The new options for 'aragon run' are '--template', '--template-init' and 'template-deploy-event'`
      )
    }
  })
}
