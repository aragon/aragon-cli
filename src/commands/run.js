const TaskList = require('listr')
const ganache = require('ganache-core')
const Web3 = require('web3')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')
const chalk = require('chalk')
const path = require('path')
const APM = require('@aragon/apm')
const publish = require('./publish')
const devchain = require('./devchain')
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const os = require('os')
const fs = require('fs-extra')
const opn = require('opn')
const execa = require('execa')
const { compileContracts } = require('../helpers/truffle-runner')
const { isIPFSRunning, isIPFSInstalled, startIPFSDaemon, setIPFSCORS } = require('../helpers/ipfs-daemon')
const { findProjectRoot, isPortTaken, installDeps, getNodePackageManager } = require('../util')
const { Writable } = require('stream')

const TX_MIN_GAS = 10e6

exports.command = 'run'

exports.describe = 'Run the current app locally'

function getContract (pkg, contract) {
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}

function deployContract (web3, sender, { abi, bytecode }, args = []) {
  const contract = new web3.eth.Contract(abi)

  return contract.deploy({
    data: bytecode,
    arguments: args
  }).send({
    from: sender,
    gas: TX_MIN_GAS
  }).then((instance) => {
    return instance.options.address
  })
}

async function setPermissions (web3, sender, aclAddress, permissions) {
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
    module
  }) {
  const tasks = new TaskList([
    {
      title: 'Compile contracts',
      task: async () => (await compileContracts())
    },
    {
      title: 'Start a local Ethereum network',
      skip: async (ctx) => {
        try {
          const web3 = new Web3(network.provider)
          ctx.web3 = web3
          const listening = await web3.eth.net.isListening()
          ctx.accounts = await web3.eth.getAccounts()
          return 'Connected to the provided Ethereum network'
        } catch (err) {
          return false
        }
      },
      task: async (ctx, task) => {
        const { web3, accounts } = await devchain.task({})
        ctx.web3 = web3
        ctx.accounts = accounts
      }
    },
    {
      title: 'Start IPFS',
      task: async (ctx, task) => {
        const installed = await isIPFSInstalled()
        if (!installed) {
          setTimeout(() => opn('https://ipfs.io/docs/install'), 2500)
          throw new Error(`
            Running your app requires IPFS. Opening install instructions in your browser`
          )
        } else {
          const running = await isIPFSRunning()
          if (!running) {
            await startIPFSDaemon()
            await setIPFSCORS()
          } else {
            await setIPFSCORS()
            task.skip('IPFS daemon already running')
          }
        }
      }
    },
    {
      title: 'Fetching DAOFactory from on-chain templates',
      task: (ctx, task) => {
        ctx.ens = require('@aragon/aragen').ens
        const apm = APM(ctx.web3, {
          ipfs: { host: 'localhost', port: 5001, protocol: 'http' },
          ensRegistryAddress: ctx.ens
        })

        ctx.contracts = {}
        return apm.getLatestVersionContract('democracy-template.aragonpm.eth')
          .then(demTemplate => {
            return new ctx.web3.eth.Contract(
              getContract('@aragon/templates-beta', 'DemocracyTemplate').abi,
              demTemplate
          ).methods.fac().call().then(fac => { ctx.contracts['DAOFactory'] = fac })
        })
      },
    },
    {
      title: 'Create DAO',
      task: (ctx, task) => {
        const factory = new ctx.web3.eth.Contract(
          getContract('@aragon/os', 'DAOFactory').abi,
          ctx.contracts['DAOFactory']
        )

        return factory.methods.newDAO(
          ctx.accounts[0]
        ).send({
          from: ctx.accounts[0],
          gas: TX_MIN_GAS
        }).then(({ events }) => {
          ctx.daoAddress = events['DeployDAO'].returnValues.dao

          const kernel = new ctx.web3.eth.Contract(
          getContract('@aragon/os', 'Kernel').abi,
            ctx.daoAddress
          )
          return kernel.methods.acl().call()
        }).then((aclAddress) => {
          ctx.aclAddress = aclAddress
        })
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
      title: 'Deploy app code',
      task: (ctx, task) => deployContract(ctx.web3, ctx.accounts[0], getContract(cwd, path.basename(module.path, '.sol'))
      ).then((appCodeAddress) => {
        ctx.contracts['AppCode'] = appCodeAddress
      })
    },
    {
      title: 'Publish app',
      task: (ctx) => {
        ctx.apm = APM(ctx.web3, {
          ipfs: { host: 'localhost', port: 5001, protocol: 'http' },
          ensRegistryAddress: ctx.ens
        })
        return publish.task({
          alreadyCompiled: true,
          contract: ctx.contracts['AppCode'],
          provider: 'ipfs',
          files: ['.'],
          ignore: ['node_modules'],
          reporter,
          cwd,
          network,
          module,
          web3: ctx.web3,
          apm: apmOptions,
        })
      }
    },
    {
      title: 'Install app',
      task: () => new TaskList([
        {
          title: 'Deploy proxy',
          task: (ctx) => {
            const kernel = new ctx.web3.eth.Contract(
              getContract('@aragon/os', 'Kernel').abi,
              ctx.daoAddress
            )

            return kernel.methods.newAppInstance(
              namehash.hash(module.appName),
              ctx.contracts['AppCode']
            ).send({
              from: ctx.accounts[0],
              gasLimit: TX_MIN_GAS
            }).then(({ events }) => {
              ctx.appAddress = events['NewAppProxy'].returnValues.proxy
            })
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
            // TODO: Clean when https://github.com/aragon/aragon/pull/237 is merged
            const WRAPPER_COMMIT = '18f46c83cbde07da625a6d75fd5b6ca449158c7f'
            const TEMP_WRAPPER_BRANCH = 'remotes/origin/start-url-2'
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
              { checkout: TEMP_WRAPPER_BRANCH }
            )
          }
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
                  REACT_APP_IPFS_GATEWAY: 'http://localhost:8080/ipfs',
                  REACT_APP_IPFS_RPC: 'http://localhost:5001',
                  REACT_APP_DEFAULT_ETH_NODE: `ws://localhost:${network.port}`,
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
      ])
    }
  ])

  const manifestPath = path.resolve(findProjectRoot(), 'manifest.json')
  let manifest
  if (fs.existsSync(manifestPath)) {
    manifest = fs.readJsonSync(manifestPath)
  }

  return tasks.run().then((ctx) => {
    reporter.info(`You are now ready to open your app in Aragon.

    This is the configuration for your development deployment:
    ${chalk.bold('Ethereum Node')}: ${network.provider.connection._url}
    ${chalk.bold('APM registry')}: ${ctx.registryAddress}
    ${chalk.bold('ENS registry')}: ${ctx.ens}
    ${chalk.bold('DAO address')}: ${ctx.daoAddress}

    Here are some accounts you can use.
    The first one was used to create everything.

    ${ctx.accounts.map((account) => chalk.bold(`Address: ${account}\n  `))}

    Open up http://localhost:3000/#/${ctx.daoAddress} to view your DAO!`)
    if (!manifest) {
      reporter.warning('No front-end detected (no manifest.json)')
    } else if (!manifest.start_url) {
      reporter.warning('No front-end detected (no start_url defined)')
    }
  })
}
