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
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const os = require('os')
const fs = require('fs-extra')
const opn = require('opn')
const execa = require('execa')
const {
  isIPFSInstalled,
  startIPFSDaemon,
  isIPFSCORS,
  setIPFSCORS
} = require('../helpers/ipfs-daemon')
const {
  findProjectRoot,
  isPortTaken,
  installDeps,
  getNodePackageManager
} = require('../util')
const { Writable } = require('stream')
const url = require('url')

const TX_MIN_GAS = 10e6

exports.command = 'run'

exports.describe = 'Run the current app locally'

exports.builder = function (yargs) {
  return yargs.option('no-client', {
    description: 'Just run the smart contracts, without the Aragon client',
    default: false,
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

const getContract = (pkg, contract) => {
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}

const setPermissions = async (web3, sender, aclAddress, permissions) => {
  const acl = new web3.eth.Contract(
    getContract('@aragon/os', 'ACL').abi,
    aclAddress
  )
  return Promise.all(
    permissions.map(([who, where, what]) =>
      acl.methods.createPermission(who, where, '0x' + keccak256(what), who).send({
        from: sender,
        gasLimit: TX_MIN_GAS
      })
    )
  )
}

const ANY_ENTITY = '0xffffffffffffffffffffffffffffffffffffffff'

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
        const { web3, accounts, privateKeys } = await devchain.task({ port, reset, showAccounts })
        ctx.web3 = web3
        ctx.accounts = accounts
        ctx.privateKeys = privateKeys

        if (ctx.accounts.length == 0) throw new Error("Devchain started with no accounts")
      }
    },
    {
      title: 'Start IPFS',
      task: async (ctx, task) => {
        // If the dev manually set their IPFS node, skip install and running check
        if (apmOptions.ipfs.rpc.default) {
          const installed = await isIPFSInstalled()
          if (!installed) {
            setTimeout(() => opn('https://ipfs.io/docs/install'), 2500)
            throw new Error(`
              Running your app requires IPFS. Opening install instructions in your browser`
            )
          } else {
            const running = await isPortTaken(apmOptions.ipfs.rpc.port)
            if (!running) {
              task.output = 'Starting IPFS at port: ' + apmOptions.ipfs.rpc.port
              await startIPFSDaemon()
              await setIPFSCORS(apmOptions.ipfs.rpc)
            } else {
              task.output = 'IPFS is started, checking CORS config'
              await setIPFSCORS(apmOptions.ipfs.rpc)
              task.skip('Connected to IPFS daemon ar port: '+ apmOptions.ipfs.rpc.port)
            }
          }
        } else {
          await isIPFSCORS(apmOptions.ipfs.rpc)
          task.skip('Connecting to provided IPFS daemon')
        }
      }
    },
    {
      title: 'Fetching DAOFactory from on-chain templates',
      task: async(ctx, task) => {
        ctx.ens = require('@aragon/aragen').ens
        ctx.apm = APM(ctx.web3, {
          ipfs: apmOptions.ipfs.rpc,
          ensRegistryAddress: ctx.ens
        })

        ctx.contracts = {}
        try {
          const demTemplate = await ctx.apm.getLatestVersionContract('democracy-template.aragonpm.eth')
          const fac = await new ctx.web3.eth.Contract(
            getContract('@aragon/templates-beta', 'DemocracyTemplate').abi,
            demTemplate
          ).methods.fac().call()
          ctx.contracts['DAOFactory'] = fac
        } catch (err) {
          console.error(`${err}\nTransaction reverted, try using 'aragon run' or 'aragon devchain'`)
          process.exit()
        }
      },
    },
    {
      title: 'Create DAO',
      task: async (ctx, task) => {
        const factory = new ctx.web3.eth.Contract(
          getContract('@aragon/os', 'DAOFactory').abi,
          ctx.contracts['DAOFactory']
        )

        const { events } = await factory.methods.newDAO(ctx.accounts[0]).send({
          from: ctx.accounts[0],
          gas: TX_MIN_GAS
        })
        ctx.daoAddress = events['DeployDAO'].returnValues.dao

        const kernel = new ctx.web3.eth.Contract(
          getContract('@aragon/os', 'Kernel').abi, ctx.daoAddress
        )
        const aclAddress = await kernel.methods.acl().call()
        ctx.aclAddress = aclAddress
      }
    },
    {
      title: 'Set DAO permissions',
      task: (ctx, task) =>
        setPermissions(ctx.web3, ctx.accounts[0], ctx.aclAddress, [
          [ANY_ENTITY, ctx.daoAddress, 'APP_MANAGER_ROLE']
        ])
    },
    {
      title: 'Publish APM package',
      task: (ctx) => {
        return publish.task({
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
        })
      }
    },
    {
      title: 'Install app',
      task: () => new TaskList([
        {
          title: 'Deploy proxy',
          task: async (ctx) => {
            const kernel = new ctx.web3.eth.Contract(
              getContract('@aragon/os', 'Kernel').abi,
              ctx.daoAddress
            )

            // Use latest APM version
            const { contractAddress } = await ctx.apm.getLatestVersion(module.appName)

            const { events } = await kernel.methods.newAppInstance(
              namehash.hash(module.appName),
              contractAddress
            ).send({
              from: ctx.accounts[0],
              gasLimit: TX_MIN_GAS
            })
            
            ctx.appAddress = events['NewAppProxy'].returnValues.proxy
          }
        },
        {
          title: 'Set permissions',
          task: async (ctx, task) => {
            if (!module.roles || module.roles.length === 0) {
              throw new Error('You have no permissions defined in your arapp.json\nThis is required for your app to properly show up.')
              return
            }

            const permissions = module.roles
              .map((role) => [ANY_ENTITY, ctx.appAddress, role.id])

            return setPermissions(
              ctx.web3,
              ctx.accounts[0],
              ctx.aclAddress,
              permissions
            )
          }
        }
      ])
    },
    {
      title: 'Open DAO',
      task: (ctx, task) => new TaskList([
        {
          title: 'Download wrapper',
          task: (ctx, task) => {
            const WRAPPER_COMMIT = '5e4bb9f803ab274db190ebc98b1e3ac77be8ba1f'
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
            const bin = await getNodePackageManager()
            execa(
              bin,
              ['start'],
              {
                cwd: ctx.wrapperPath,
                env: {
                  BROWSER: 'none',
                  REACT_APP_IPFS_GATEWAY: `http://${apmOptions.ipfs.rpc.host}:8080/ipfs`,
                  REACT_APP_IPFS_RPC: url.format({
                    protocol: apmOptions.ipfs.rpc.protocol,
                    hostname: apmOptions.ipfs.rpc.host,
                    port: apmOptions.ipfs.rpc.port
                  }),
                  REACT_APP_DEFAULT_ETH_NODE: network.provider.connection._url,
                  REACT_APP_ENS_REGISTRY_ADDRESS: ctx.ens
                }
              }
            ).catch((err) => {
              throw new Error(err)
            })
          }
        },
        {
          title: 'Open wrapper',
          task: (ctx, task) => {
            // Check until the wrapper is served
            const checkWrapperReady = () => {
              setTimeout(async () => {
                const portTaken = await isPortTaken(3000)
                if (portTaken) {
                  opn(`http://localhost:3000/#/${ctx.daoAddress}`)
                } else {
                  checkWrapperReady()
                }
              }, 250)
            }
            checkWrapperReady()
          }
        }
      ]),
      enabled: () => client !== false
    }
  ])

  const manifestPath = path.resolve(findProjectRoot(), 'manifest.json')
  let manifest
  if (fs.existsSync(manifestPath)) {
    manifest = fs.readJsonSync(manifestPath)
  }

  return tasks.run().then(async (ctx) => {

    reporter.info(`You are now ready to open your app in Aragon.`)

    if (ctx.privateKeys) {
      devchain.printAccounts(reporter, ctx.privateKeys)
    }

    const registry = module.appName.split('.').slice(1).join('.')
    const registryAddr = await ctx.apm.ensResolve(registry)

    reporter.info(`This is the configuration for your development deployment:
    ${chalk.bold('Ethereum Node')}: ${network.provider.connection._url}
    ${chalk.bold(`APM registry (${registry})`)}: ${registryAddr}
    ${chalk.bold('ENS registry')}: ${ctx.ens}
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
