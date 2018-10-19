const path = require('path')
const TaskList = require('listr')
const chalk = require('chalk')

const { compileContracts } = require('../helpers/truffle-runner')
const { findProjectRoot } = require('../util')
const { ensureWeb3 } = require('../helpers/web3-fallback')

exports.command = 'deploy [contract]'

exports.describe = 'Deploys contract code of the app to the chain'

exports.arappContract = () => {
  const contractPath = require(path.resolve(findProjectRoot(), 'arapp.json')).path
  const contractName = path.basename(contractPath).split('.')[0]

  return contractName
}

exports.builder = yargs => {
  return yargs.positional('contract', {
    description: 'Contract name (defaults to the contract at the path in arapp.json)'
  }).option('init', {
    description: 'Arguments to be passed to contract constructor',
    array: true,
    default: []
  })
}

exports.task = async ({ reporter, network, cwd, contract, init, web3, apmOptions }) => {
  if (!contract) {
    contract = exports.arappContract()
  }
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  if (!web3) {
    web3 = await ensureWeb3(network)
  }

  init = init || []

  // Mappings allow to pass certain init parameters that get replaced for their actual value
  const mappingMask = key => `@ARAGON_${key}`
  const mappings = {
    [mappingMask('ENS')]: () => apmOptions.ensRegistryAddress // <ens> to ens addr
  }
  const processedInit = init.map(value => mappings[value] ? mappings[value]() : value)

  const contractName = contract
  const tasks = new TaskList([
    {
      title: 'Compile contracts',
      task: async () => {
        await compileContracts()
      }
    },
    {
      title: `Deploy '${contractName}' to network`,
      task: async (ctx, task) => {
        ctx.contractName = contractName
        let contractArtifacts
        try {
          contractArtifacts = require(path.join(cwd, 'build/contracts', contractName))
        } catch (e) {
          throw new Error('Contract artifact couldnt be found. Please ensure your contract name is the same as the filename.')
        }

        const { abi, bytecode } = contractArtifacts

        if (!bytecode || bytecode === '0x') {
          throw new Error('Contract bytecode couldnt be generated. Contracts that dont implement all interface methods cant be deployed')
        }

        task.output = `Deploying '${contractName}' to network`

        const contract = new web3.eth.Contract(abi, { data: bytecode })
        const accounts = await web3.eth.getAccounts()
        const deployTx = contract.deploy({ arguments: processedInit })
        const gas = await deployTx.estimateGas()

        const instance = await deployTx.send({ from: accounts[0], gas, gasPrice: '19000000000' }) // 19 gwei

        if (!instance.options.address) {
          throw new Error('Contract deployment failed')
        }

        ctx.contractInstance = instance
        ctx.contract = instance.options.address
        return ctx.contract
      }
    }
  ])
  return tasks
}

exports.handler = async ({ reporter, network, cwd, contract, init, apm: apmOptions }) => {
  const task = await exports.task({ reporter, network, cwd, contract, init, apmOptions })
  const ctx = await task.run()

  reporter.success(`Successfully deployed ${ctx.contractName} at: ${chalk.bold(ctx.contract)}`)
  process.exit()
}
