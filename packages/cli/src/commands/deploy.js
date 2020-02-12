import path from 'path'
import TaskList from 'listr'
import { blue, green } from 'chalk'
import { loadArappFile } from '@aragon/toolkit'
//
import { compileContracts } from '../helpers/truffle-runner'
import deployArtifacts from '../helpers/truffle-deploy-artifacts'
import listrOpts from '../helpers/listr-options'
import { findProjectRoot } from '../util'
import { linkLibraries, deployContract } from '../lib/deploy/deploy'

export const command = 'deploy [contract]'
export const describe = 'Deploys contract code of the app to the chain'

export const arappContract = () => {
  const contractPath = require(path.resolve(findProjectRoot(), 'arapp.json'))
    .path
  const contractName = path.basename(contractPath).split('.')[0]

  return contractName
}

export const builder = yargs => {
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

export const task = async ({
  cwd,
  environment,
  contract,
  init = [],
  silent,
  debug,
}) => {
  const { links } = loadArappFile()

  if (!contract) {
    contract = arappContract()
  }

  const contractName = contract

  const tasks = new TaskList(
    [
      {
        title: 'Compile contracts',
        task: async () => compileContracts(),
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

          if (!bytecode || bytecode === '0x') {
            throw new Error(
              'Contract bytecode couldnt be generated. Contracts that dont implement all interface methods cant be deployed'
            )
          }

          task.output = `Deploying '${contractName}' to network`

          const { instance, address, transactionHash } = await deployContract(
            links ? linkLibraries(bytecode, links) : bytecode,
            abi,
            init,
            environment
          )

          if (!address) {
            throw new Error('Contract deployment failed')
          }

          ctx.contractInstance = instance
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

export const handler = async ({
  reporter,
  cwd,
  environment,
  contract,
  init,
  silent,
  debug,
}) => {
  const tasks = await task({
    reporter,
    cwd,
    environment,
    contract,
    init,
    silent,
    debug,
  })
  const ctx = await tasks.run()

  reporter.success(
    `Successfully deployed ${blue(ctx.contractName)} at: ${green(
      ctx.contractAddress
    )}`
  )
  reporter.info(`Transaction hash: ${blue(ctx.transactionHash)}`)
}
