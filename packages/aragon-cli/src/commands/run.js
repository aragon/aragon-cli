const TaskList = require('listr')
const Web3 = require('web3')
const chalk = require('chalk')
const path = require('path')
const publish = require('./apm_cmds/publish')
const devchain = require('./devchain')
const deploy = require('./deploy')
const newDAO = require('./dao_cmds/new')
const startIPFS = require('./ipfs')
const encodeInitPayload = require('./dao_cmds/utils/encodeInitPayload')
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const os = require('os')
const fs = require('fs-extra')
const opn = require('opn')
const execa = require('execa')
const pkg = require('../../package.json')
const listrOpts = require('../helpers/listr-options')

const {
  findProjectRoot,
  isPortTaken,
  installDeps,
  getNodePackageManager,
} = require('../util')

const url = require('url')

const DEFAULT_CLIENT_VERSION = pkg.aragon.clientVersion
const DEFAULT_CLIENT_PORT = pkg.aragon.clientPort

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
      default: newDAO.BARE_KIT,
      description: 'Kit contract name',
    })
    .option('kit-init', {
      description: 'Arguments to be passed to the kit constructor',
      array: true,
      default: [],
    })
    .option('kit-deploy-event', {
      description: 'Arguments to be passed to the kit constructor',
      default: newDAO.BARE_KIT_DEPLOY_EVENT,
    })
    .option('build-script', {
      description: 'The npm script that will be run when building the app',
      default: 'build',
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
  buildScript,
  http,
  httpServedFrom,
  appInit,
  appInitArgs,
  clientVersion,
  clientPort,
  clientPath,
}) {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  clientPort = clientPort || DEFAULT_CLIENT_PORT

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
        enabled: () => !http || kit,
      },
      {
        title: 'Publish app to APM',
        task: async ctx => {
          const publishParams = {
            alreadyCompiled: true,
            provider: 'ipfs',
            files,
            ignore: ['node_modules'],
            reporter,
            cwd,
            network,
            module,
            buildScript,
            build: true,
            contract: deploy.arappContract(),
            web3: ctx.web3,
            apm: apmOptions,
            bump: 'major',
            getRepo: true,
            http,
            httpServedFrom,
          }
          return publish.task(publishParams)
        },
      },
      {
        title: 'Deploy Kit',
        enabled: () => kit !== newDAO.BARE_KIT,
        task: ctx => {
          const deployParams = {
            contract: kit,
            init: kitInit,
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
          const roles = ctx.repo.roles.map(role => role.bytes)
          let fnArgs

          if (ctx.contractInstance) {
            // If no kit was deployed, use default params
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

            fnArgs = [ctx.repo.appId, roles, ctx.accounts[0], initPayload]
          }

          const newDAOParams = {
            kit,
            kitVersion: 'latest',
            kitInstance: ctx.contractInstance,
            fn: 'newInstance',
            fnArgs,
            deployEvent: kitDeployEvent,
            web3: ctx.web3,
            reporter,
            apmOptions,
          }

          return newDAO.task(newDAOParams)
        },
      },
      {
        title: 'Open DAO',
        task: (ctx, task) =>
          new TaskList([
            {
              title: 'Download client',
              skip: () => !!clientPath,
              task: (ctx, task) => {
                clientVersion = clientVersion || DEFAULT_CLIENT_VERSION
                const CLIENT_PATH = `${os.homedir()}/.aragon/wrapper-${clientVersion}`
                ctx.wrapperPath = CLIENT_PATH

                // Make sure we haven't already downloaded the wrapper
                if (fs.existsSync(path.resolve(CLIENT_PATH))) {
                  task.skip('Client already downloaded')
                  ctx.wrapperAvailable = true
                  return
                }

                // Ensure folder exists
                fs.ensureDirSync(CLIENT_PATH)

                // Clone wrapper
                return clone('https://github.com/aragon/aragon', CLIENT_PATH, {
                  checkout: clientVersion,
                })
              },
            },
            {
              title: 'Install client dependencies',
              task: async (ctx, task) => installDeps(ctx.wrapperPath, task),
              enabled: ctx => !ctx.wrapperAvailable && !clientPath,
            },
            {
              title: 'Start Aragon client',
              task: async (ctx, task) => {
                if (await isPortTaken(clientPort)) {
                  ctx.portOpen = true
                  return
                }
                const bin = getNodePackageManager()
                const startArguments = {
                  cwd: clientPath || ctx.wrapperPath,
                  env: {
                    REACT_APP_ENS_REGISTRY_ADDRESS: ctx.ens,
                    REACT_APP_PORT: clientPort,
                  },
                }

                execa(bin, ['run', 'start:local'], startArguments).catch(
                  err => {
                    throw new Error(err)
                  }
                )
              },
            },
            {
              title: 'Open client',
              task: (ctx, task) => {
                // Check until the wrapper is served
                const checkWrapperReady = () => {
                  setTimeout(async () => {
                    const portTaken = await isPortTaken(clientPort)
                    if (portTaken) {
                      opn(`http://localhost:${clientPort}/#/${ctx.daoAddress}`)
                    } else {
                      checkWrapperReady()
                    }
                  }, 250)
                }
                checkWrapperReady()
              },
            },
          ]),
        enabled: () => client === true,
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
    ${chalk.bold(`APM registry`)}: ${registry}
    ${chalk.bold('DAO address')}: ${ctx.daoAddress}

    ${
      client !== false
        ? `Opening http://localhost:${clientPort}/#/${
            ctx.daoAddress
          } to view your DAO`
        : `Use "aragon dao <command> ${
            ctx.daoAddress
          }" to interact with your DAO`
    }`)

    if (!manifest) {
      reporter.warning('No front-end detected (no manifest.json)')
    } else if (!manifest.start_url) {
      reporter.warning('No front-end detected (no start_url defined)')
    }
  })
}
