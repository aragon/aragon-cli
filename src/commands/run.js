const TaskList = require('listr')
const ganache = require('ganache-core')
const Web3 = require('web3')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')
const chalk = require('chalk')
const path = require('path')
const publish = require('./publish')
const APM = require('../apm')

const BLOCK_GAS_LIMIT = 50e6
const TX_MIN_GAS = 10e6

exports.command = 'run'

exports.describe = 'Run the current app locally'

exports.builder = {
  port: {
    description: 'The port to run the local chain on',
    default: 8545
  }
}

function getContract (pkg, contract) {
  return require(`${pkg}/build/contracts/${contract}.json`)
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

exports.handler = function (args) {
  const {
    // Globals
    reporter,
    cwd,
    module,

    // Arguments
    port
  } = args
  const tasks = new TaskList([
    {
      title: 'Start local chain',
      task: (ctx, task) => {
        const server = ganache.server({
          gasLimit: BLOCK_GAS_LIMIT
        })

        return new Promise((resolve, reject) => {
          server.listen(port, (err) => {
            if (err) return reject(err)

            task.title = `Local chain started at :${port}`
            resolve()
          })
        }).then(async () => {
          // Set a temporary provider for deployments
          ctx.web3 = new Web3(
            new Web3.providers.WebsocketProvider(`ws://localhost:${port}`)
          )

          // Grab the accounts
          ctx.accounts = await ctx.web3.eth.getAccounts()
          ctx.privateKeys = server.provider.manager.state.accounts
        })
      }
    },
    {
      title: 'Deploy APM and ENS',
      task: (ctx, task) => new TaskList([
        {
          title: 'Deploy base contracts',
          task: (ctx, task) => {
            ctx.contracts = {}
            const apmBaseContracts = [
              ['@aragon/os', 'APMRegistry'],
              ['@aragon/os', 'Repo'],
              ['@aragon/os', 'ENSSubdomainRegistrar'],
              ['@aragon/os', 'ENSFactory'],
              ['@aragon/os', 'Kernel'],
              ['@aragon/os', 'ACL']
            ]
              .map(([pkg, contractName]) => getContract(pkg, contractName))
              .map((artifact) =>
                deployContract(ctx.web3, ctx.accounts[0], artifact).then((contractAddress) => {
                  task.title = `Deployed ${artifact.contractName} to ${contractAddress}`

                  ctx.contracts[artifact.contractName] = contractAddress
                })
              )

            return Promise.all(
              apmBaseContracts
            )
          }
        },
        {
          title: 'Deploy base DAO factory',
          task: (ctx) => {
            // TODO: 0x0 should be address to EVMScriptRegistryFactory
            return deployContract(
              ctx.web3, ctx.accounts[0], getContract('@aragon/os', 'DAOFactory'), [
                ctx.contracts['Kernel'], ctx.contracts['ACL'], '0x0'
              ]
            ).then((daoFactoryAddress) => {
              ctx.contracts['DAOFactory'] = daoFactoryAddress
            })
          }
        },
        {
          title: 'Deploy APM registry factory',
          task: (ctx, task) => {
            return deployContract(
              ctx.web3, ctx.accounts[0], getContract('@aragon/os', 'APMRegistryFactory'), [
                ctx.contracts['DAOFactory'],
                ctx.contracts['APMRegistry'],
                ctx.contracts['Repo'],
                ctx.contracts['ENSSubdomainRegistrar'],
                '0x0',
                ctx.contracts['ENSFactory']
              ]
            ).then((apmRegistryAddress) => {
              ctx.contracts['APMRegistryFactory'] = apmRegistryAddress
            })
          }
        },
        {
          title: 'Create APM registry',
          task: (ctx) => {
            const root = '0xffffffffffffffffffffffffffffffffffffffff'
            const contract = new ctx.web3.eth.Contract(
              getContract('@aragon/os', 'APMRegistryFactory').abi,
              ctx.contracts['APMRegistryFactory']
            )

            // TODO: Create repo from appName repository
            return contract.methods.newAPM(
              namehash.hash('eth'),
              '0x' + keccak256('aragonpm'),
              root
            ).send({
              from: ctx.accounts[0],
              gas: TX_MIN_GAS
            }).then(({ events }) => {
              ctx.registryAddress = events['DeployAPM'].returnValues.apm

              const registry = new ctx.web3.eth.Contract(
                getContract('@aragon/os', 'APMRegistry').abi,
                ctx.registryAddress
              )
              return registry.methods.registrar().call()
            }).then((registrarAddress) => {
              const registrar = new ctx.web3.eth.Contract(
                getContract('@aragon/os', 'ENSSubdomainRegistrar').abi,
                registrarAddress
              )

              return registrar.methods.ens().call()
            }).then((ensAddress) => {
              ctx.ensAddress = ensAddress
            })
          }
        }
      ])
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
          [ctx.accounts[0], ctx.daoAddress, 'APP_MANAGER_ROLE']
        ])
    },
    {
      title: 'Deploy app code',
      task: (ctx, task) => deployContract(
        ctx.web3, ctx.accounts[0], getContract(cwd, path.basename(module.path, '.sol'))
      ).then((appCodeAddress) => {
        ctx.contracts['AppCode'] = appCodeAddress
      })
    },
    // TODO: Clean this up
    {
      title: 'Publish app',
      task: (ctx) => {
        ctx.apm = APM(ctx.web3, {
          ipfs: { host: 'localhost', port: 5001, protocol: 'http' },
          ensRegistry: ctx.ensAddress
        })
        ctx.privateKey = ctx.privateKeys[ctx.accounts[0].toLowerCase()].secretKey.toString('hex')
        return publish.task(Object.assign(args, {
          contract: ctx.contracts['AppCode'],
          provider: 'ipfs',
          files: ['.'],
          ignore: ['node_modules']
        }))
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
              task.skip('No permissions defined in app')
              return
            }

            const permissions = module.roles
              .map((role) => [ctx.accounts[0], ctx.appAddress, role.id])

            return setPermissions(
              ctx.web3,
              ctx.accounts[0],
              ctx.aclAddress,
              permissions
            )
          }
        }
      ])
    }
  ])

  return tasks.run().then((ctx) => {
    reporter.info(`You are now ready to open your app in Aragon.

   This is the configuration for your development deployment:
   ${chalk.bold('Ethereum Node')}: ws://localhost:${port}
   ${chalk.bold('APM registry')}: ${ctx.registryAddress}
   ${chalk.bold('ENS registry')}: ${ctx.ensAddress}
   ${chalk.bold('DAO address')}: ${ctx.daoAddress}

   Here are some accounts you can use.
   The first one was used to create everything.

   ${Object.keys(ctx.privateKeys).map((address) =>
      chalk.bold(`${address}: `) + ctx.privateKeys[address].secretKey.toString('hex')).join('\n   ')}

   Open up https://app.aragon.com and enter this configuration in the settings!`)
  })
}
