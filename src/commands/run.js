const TaskList = require('listr')
const ganache = require('ganache-core')
const Web3 = require('web3')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')
const chalk = require('chalk')
const path = require('path')
const APM = require('@aragon/apm')
const publish = require('./apm_cmds/publish')
const devchain = require('./devchain')
const deploy = require('./deploy')
const newDAO = require('./dao_cmds/new')
const install = require('./dao_cmds/install')
const startIPFS = require('./ipfs')
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const os = require('os')
const fs = require('fs-extra')
const opn = require('opn')
const execa = require('execa')

const {
  findProjectRoot,
  isPortTaken,
  installDeps,
  getNodePackageManager,
  getContract,
  ANY_ENTITY
} = require('../util')

const { Writable } = require('stream')
const url = require('url')

const TX_MIN_GAS = 10e6
const WRAPPER_PORT = 3000

exports.command = 'run'

exports.describe = 'Run the current app locally'

exports.builder = function (yargs) {
  return yargs.option('client', {
    description: 'Just run the smart contracts, without the Aragon client',
    default: true,
    boolean: true
  }).option('files', {
    description: 'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
    default: ['.'],
    array: true
  }).option('port', {
    description: 'Port to start devchain at',
    default: '8545',
  }).option('accounts', {
    default: 2,
    description: 'Number of accounts to print'
  }).option('reset', {
    default: false,
    boolean: true,
    description: 'Reset devchain to snapshot'
  })
}

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

exports.handler = function ({
    // Globals
    reporter,
    cwd,
    apm: apmOptions,
    network,
    module,
    client,
    files,
    port,
    accounts,
    reset
  }) {
  const showAccounts = accounts
  const tasks = new TaskList([
    {
      title: 'Start a local Ethereum network',
      skip: async (ctx) => {
        const hostURL = new url.URL(network.provider.connection._url)
        if (!await isPortTaken(hostURL.port)) {
          return false
        } else {
          ctx.web3 = new Web3(network.provider)
          ctx.accounts = await ctx.web3.eth.getAccounts()
          return 'Connected to the provided Ethereum network'
        }
      },
      task: async (ctx, task) => {
        return await devchain.task({ port, reset, showAccounts })
      }
    },
    {
      title: 'Check IPFS',
      task: () => startIPFS.task({ apmOptions }),
    },
    { 
      title: 'Create DAO',
      task: (ctx) => newDAO.task({ web3: ctx.web3, reporter, apmOptions }),
    },
    {
      title: 'Initializing DAO permissions',
      task: (ctx, task) =>
        setPermissions(ctx.web3, ctx.accounts[0], ctx.aclAddress, [
          [ANY_ENTITY, ctx.daoAddress, ctx.appManagerRole]
        ])
    },
    {
      title: 'Publish APM package',
      task: (ctx) => {
        const publishParams = {
          alreadyCompiled: true,
          provider: 'ipfs',
          files,
          ignore: ['node_modules'],
          reporter,
          cwd,
          network,
          module,
          web3: ctx.web3,
          apm: apmOptions,
          automaticallyBump: true
        }
        return publish.task(publishParams)
      },
    },
    {
      title: 'Install app',
      task: (ctx) => {
        const installParams = {
          dao: ctx.daoAddress,
          apmRepo: module.appName,
          apmRepoVersion: 'latest',
          web3: ctx.web3,
          reporter,
          apmOptions,
        }
        return install.task(installParams)
      }
    },
    {
      title: 'Open DAO',
      task: (ctx, task) => new TaskList([
        {
          title: 'Download wrapper',
          task: (ctx, task) => {
            const WRAPPER_COMMIT = '2b0558424c5cca084ecdcadb5429c7c19ef82dee'
            const WRAPPER_BRANCH = 'remotes/origin/master'
            const WRAPPER_PATH = `${os.homedir()}/.aragon/wrapper-${WRAPPER_COMMIT}`
            ctx.wrapperPath = WRAPPER_PATH

            // Make sure we haven't already downloaded the wrapper
            if (fs.existsSync(path.resolve(WRAPPER_PATH))) {
              task.skip('Wrapper already downloaded')
              ctx.wrapperAvailable = true
              return
            }

            // Ensure folder exists
            fs.ensureDirSync(WRAPPER_PATH)

            // Clone wrapper
            return clone(
              'https://github.com/aragon/aragon',
              WRAPPER_PATH,
              { checkout: WRAPPER_BRANCH }
            )
          },
        },
        {
          title: 'Install wrapper dependencies',
          task: async (ctx, task) => (await installDeps(ctx.wrapperPath, task)),
          enabled: (ctx) => !ctx.wrapperAvailable
        },
        {
          title: 'Start Aragon client',
          task: async (ctx, task) => {
            if (await isPortTaken(WRAPPER_PORT)) {
              ctx.portOpen = true
              return
            }
            const bin = await getNodePackageManager()
            const startArguments = {
              cwd: ctx.wrapperPath,
              env: {
                REACT_APP_ENS_REGISTRY_ADDRESS: ctx.ens
              }
            }
            execa(bin, ['run', 'start:local'], startArguments).catch((err) => { throw new Error(err) })
          }
        },
        {
          title: 'Open wrapper',
          task: (ctx, task) => {
            // Check until the wrapper is served
            const checkWrapperReady = () => {
              setTimeout(async () => {
                const portTaken = await isPortTaken(WRAPPER_PORT)
                if (portTaken) {
                  opn(`http://localhost:${WRAPPER_PORT}/#/${ctx.daoAddress}`)
                } else {
                  checkWrapperReady()
                }
              }, 250)
            }
            checkWrapperReady()
          }
        }
      ]),
      enabled: () => client === true
    }
  ])

  const manifestPath = path.resolve(findProjectRoot(), 'manifest.json')
  let manifest
  if (fs.existsSync(manifestPath)) {
    manifest = fs.readJsonSync(manifestPath)
  }

  return tasks.run({ ens: apmOptions['ens-registry'] }).then(async (ctx) => {
    if (ctx.portOpen) {
      reporter.warning(`Server already listening at port ${WRAPPER_PORT}, skipped starting Aragon`)
    }

    reporter.info(`You are now ready to open your app in Aragon.`)

    if (ctx.privateKeys) {
      devchain.printAccounts(reporter, ctx.privateKeys)
    }

    const registry = module.appName.split('.').slice(1).join('.')

    console.log()
    reporter.info(`This is the configuration for your development deployment:
    ${chalk.bold('Ethereum Node')}: ${network.provider.connection._url}
    ${chalk.bold('ENS registry')}: ${ctx.ens}
    ${chalk.bold(`APM registry`)}: ${registry}
    ${chalk.bold('DAO address')}: ${ctx.daoAddress}

    ${(client !== false) ?
      `Opening http://localhost:3000/#/${ctx.daoAddress} to view your DAO` :
      `Use "aragon dao <command> ${ctx.daoAddress}" to interact with your DAO`
    }`)

    if (!manifest) {
      reporter.warning('No front-end detected (no manifest.json)')
    } else if (!manifest.start_url) {
      reporter.warning('No front-end detected (no start_url defined)')
    }
  })
}
