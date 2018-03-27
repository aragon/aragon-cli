const TaskList = require('listr')
const ganache = require('ganache-core')
const Web3 = require('web3')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')
const chalk = require('chalk')

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

exports.handler = function ({ reporter, port }) {
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
            // 0x0 should be address to EVMScriptRegistryFactory
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
        })
      }
    },
    {
      title: 'Starting APM HTTP provider',
      task: (ctx, task) => {
        task.title = 'Started APM HTTP provider on :1337'
      }
    }
  ])

  return tasks.run().then((ctx) => {
    reporter.info(`You are now ready to open your app in Aragon.

   This is the configuration for your development deployment:

   ${chalk.bold('Ethereum Node')}: ws://localhost:${port}
   ${chalk.bold('APM registry')}: ${ctx.registryAddress}
   ${chalk.bold('ENS registry')}: ${ctx.ensAddress}
   ${chalk.bold('DAO address')}: ${ctx.daoAddress}

   Open up https://beta.aragon.com and enter this configuration in the settings!`)
  })
}
