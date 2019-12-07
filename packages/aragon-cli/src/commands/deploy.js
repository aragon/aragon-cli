const path = require('path')
const TaskList = require('listr')
const { blue, green } = require('chalk')
//
const { compileContracts } = require('../helpers/truffle-runner')
const { ensureWeb3 } = require('../helpers/web3-fallback')
const deployArtifacts = require('../helpers/truffle-deploy-artifacts')
const listrOpts = require('../helpers/listr-options')
const { findProjectRoot } = require('../util')

const { linkLibraries, deployContract } = require('../lib/deploy/deploy')

exports.command = 'deploy [contract]'

exports.describe = 'Deploys contract code of the app to the chain'

exports.arappContract = () => {
  const contractPath = require(path.resolve(findProjectRoot(), 'arapp.json'))
    .path
  const contractName = path.basename(contractPath).split('.')[0]

  return contractName
}

exports.builder = yargs => {
  return yargs
    .positional('contract', {
      description:
        'Contract name (defaults to the contract at the path in arapp.json)',
    })
    .option('init', {
      description: 'Arguments to be passed to contract constructor',
      array: true,
      default: [],
    })
}

exports.task = async ({
  module,
  network,
  gasPrice,
  cwd,
  contract,
  init = [],
  web3,
  apmOptions,
  silent,
  debug,
}) => {
  if (!contract) {
    contract = exports.arappContract()
  }
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  if (!web3) {
    web3 = await ensureWeb3(network)
  }

  // Mappings allow to pass certain init parameters that get replaced for their actual value
  // const mappingMask = key => `@ARAGON_${key}`
  const mappings = {
    '@ARAGON_ENS': apmOptions['ens-registry'], // <ens> to ens addr
  }
  const initArguments = init.map(value => mappings[value] || value)

  const contractName = contract
  const tasks = new TaskList(
    [
      {
        title: 'Compile contracts',
        task: async () => {
          await compileContracts()
        },
      },
      {
        title: `Deploy '${contractName}' to network`,
        task: async (ctx, task) => {
          try {
            ctx.contractArtifacts = require(path.join(
              cwd,
              'build/contracts',
              contractName
            ))
          } catch (e) {
            throw new Error(
              'Contract artifact couldnt be found. Please ensure your contract name is the same as the filename.'
            )
          }

          const { bytecode, abi } = ctx.contractArtifacts || {}
          const { links } = (module || {}).env || {}

          if (!bytecode || bytecode === '0x') {
            throw new Error(
              'Contract bytecode couldnt be generated. Contracts that dont implement all interface methods cant be deployed'
            )
          }

          task.output = `Deploying '${contractName}' to network`

          const { address, transactionHash } = await deployContract({
            bytecode: links ? linkLibraries(bytecode, links) : bytecode,
            abi,
            initArguments,
            gasPrice: network.gasPrice || gasPrice,
            web3,
          })

          if (!address) {
            throw new Error('Contract deployment failed')
          }

          ctx.contractName = contractName
          ctx.contractAddress = address
          ctx.transactionHash = transactionHash
        },
      },
      {
        title: 'Generate deployment artifacts',
        task: async ctx => {
          ctx.deployArtifacts = await deployArtifacts(ctx.contractArtifacts)
          ctx.deployArtifacts.transactionHash = ctx.transactionHash
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
}

exports.handler = async ({
  module,
  reporter,
  gasPrice,
  network,
  cwd,
  contract,
  init,
  apm: apmOptions,
  silent,
  debug,
}) => {
  const task = await exports.task({
    module,
    reporter,
    gasPrice,
    network,
    cwd,
    contract,
    init,
    apmOptions,
    silent,
    debug,
  })
  const ctx = await task.run()

  reporter.success(
    `Successfully deployed ${blue(ctx.contractName)} at: ${green(
      ctx.contractAddress
    )}`
  )
  reporter.info(`Transaction hash: ${blue(ctx.transactionHash)}`)

  process.exit()
}
