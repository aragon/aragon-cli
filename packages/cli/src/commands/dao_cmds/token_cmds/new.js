import TaskList from 'listr'
import { green, blue } from 'chalk'
import { isAddress } from 'web3-utils'
import {
  deployMiniMeTokenFactory,
  deployMiniMeToken,
  useEnvironment,
} from '@aragon/toolkit'
//
import listrOpts from '../../../helpers/listr-options'
import { parseArgumentStringIfPossible } from '../../../util'

const MAINNET_MINIME_TOKEN_FACTORY =
  '0xA29EF584c389c67178aE9152aC9C543f9156E2B3'
const GOERLI_MINIME_TOKEN_FACTORY = '0xc081540adf65f1da5e1bc61f360ee4a9feb0e1ef'

export const command =
  'new <token-name> <symbol> [decimal-units] [transfer-enabled] [token-factory-address]'
export const describe = 'Create a new MiniMe token'

export const builder = yargs => {
  return yargs
    .positional('token-name', {
      description: 'Full name of the new Token',
    })
    .positional('symbol', {
      description: 'Symbol of the new Token',
    })
    .option('decimal-units', {
      description: 'Total decimal units the new token will use',
      default: 18,
    })
    .option('transfer-enabled', {
      description: 'Whether the new token will have transfers enabled',
      default: true,
    })
    .option('token-factory-address', {
      description: 'Address of the MiniMeTokenFactory',
      type: 'string',
    })
}

export const task = async ({
  environment,
  tokenName,
  symbol,
  transferEnabled,
  decimalUnits,
  tokenFactoryAddress,
  silent,
  debug,
}) => {
  const { web3 } = useEnvironment(environment)

  // Decode sender  // TODO: Stop using web3 for this
  const accounts = await web3.eth.getAccounts()
  const from = accounts[0]

  // Get chain id
  const chainId = await web3.eth.net.getId()

  if (chainId === 1)
    tokenFactoryAddress = tokenFactoryAddress || MAINNET_MINIME_TOKEN_FACTORY

  if (chainId === 5)
    tokenFactoryAddress = tokenFactoryAddress || GOERLI_MINIME_TOKEN_FACTORY

  transferEnabled = parseArgumentStringIfPossible(transferEnabled)

  return new TaskList(
    [
      {
        title: 'Deploy the MiniMeTokenFactory contract',
        enabled: () => !isAddress(tokenFactoryAddress),
        task: async (ctx, task) => {
          const handleProgress = (step, data) => {
            switch (step) {
              case 1:
                task.output = 'Estimating gas...'
                break
              case 2:
                task.output = `Estimated gas: ${data}`
                break
              case 3:
                task.output = 'Waiting for the transaction to be mined...'
                break
            }
          }
          const { address, txHash } = await deployMiniMeTokenFactory(
            from,
            handleProgress,
            environment
          )
          ctx.factoryAddress = address
          ctx.factoryTxHash = txHash
        },
      },
      {
        title: 'Deploy the MiniMeToken contract',
        task: async (ctx, task) => {
          const handleProgress = (step, data) => {
            switch (step) {
              case 1:
                task.output = 'Estimating gas...'
                break
              case 2:
                task.output = `Estimated gas: ${data}`
                break
              case 3:
                task.output = 'Waiting for the transaction to be mined...'
                break
            }
          }

          const { address, txHash } = await deployMiniMeToken(
            from,
            tokenName,
            decimalUnits,
            symbol,
            transferEnabled,
            ctx.factoryAddress || tokenFactoryAddress,
            handleProgress,
            environment
          )
          ctx.tokenAddress = address
          ctx.tokenTxHash = txHash
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

export const handler = async function({
  reporter,
  environment,
  tokenName,
  symbol,
  transferEnabled,
  decimalUnits,
  tokenFactoryAddress,
  silent,
  debug,
}) {
  const tasks = await task({
    environment,
    tokenName,
    symbol,
    transferEnabled,
    decimalUnits,
    tokenFactoryAddress,
    silent,
    debug,
  })
  return tasks.run().then(ctx => {
    reporter.newLine()
    reporter.success(
      `Successfully deployed the token at ${green(ctx.tokenAddress)}`
    )
    reporter.info(`Token transaction hash: ${blue(ctx.tokenTxHash)}`)

    if (ctx.factoryAddress) {
      reporter.newLine()
      reporter.success(
        `Successfully deployed the token factory at ${green(
          ctx.factoryAddress
        )}`
      )
      reporter.info(
        `Token factory transaction hash: ${blue(ctx.factoryTxHash)}`
      )
    }
  })
}
