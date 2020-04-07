import TaskList from 'listr'
import { green, blue } from 'chalk'
import web3Utils from 'web3-utils'
import { deployMiniMeTokenFactory, deployMiniMeToken } from '@aragon/toolkit'
//
import { ensureWeb3 } from '../../../helpers/web3-fallback'
import listrOpts from '../../../helpers/listr-options'
import { parseArgumentStringIfPossible } from '../../../util'

const MAINNET_MINIME_TOKEN_FACTORY =
  '0xA29EF584c389c67178aE9152aC9C543f9156E2B3'
const RINKEBY_MINIME_TOKEN_FACTORY =
  '0xad991658443c56b3dE2D7d7f5d8C68F339aEef29'

export const command =
  'new <token-name> <symbol> [decimal-units] [transfer-enabled] [token-factory-address]'
export const describe = 'Create a new MiniMe token'

export const builder = (yargs) => {
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
  web3,
  gasPrice,
  tokenName,
  symbol,
  transferEnabled,
  decimalUnits,
  tokenFactoryAddress,
  silent,
  debug,
}) => {
  // Decode sender
  const accounts = await web3.eth.getAccounts()
  const from = accounts[0]

  // Get chain id
  const chainId = await web3.eth.net.getId()

  if (chainId === 1)
    tokenFactoryAddress = tokenFactoryAddress || MAINNET_MINIME_TOKEN_FACTORY

  if (chainId === 4)
    tokenFactoryAddress = tokenFactoryAddress || RINKEBY_MINIME_TOKEN_FACTORY

  transferEnabled = parseArgumentStringIfPossible(transferEnabled)

  return new TaskList(
    [
      {
        title: 'Deploy the MiniMeTokenFactory contract',
        enabled: () => !web3Utils.isAddress(tokenFactoryAddress),
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
            web3,
            from,
            gasPrice,
            handleProgress
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
            web3,
            from,
            gasPrice,
            tokenName,
            decimalUnits,
            symbol,
            transferEnabled,
            ctx.factoryAddress || tokenFactoryAddress,
            handleProgress
          )
          ctx.tokenAddress = address
          ctx.tokenTxHash = txHash
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

export const handler = async function ({
  reporter,
  network,
  gasPrice,
  tokenName,
  symbol,
  transferEnabled,
  decimalUnits,
  tokenFactoryAddress,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)

  const tasks = await task({
    web3,
    gasPrice,
    tokenName,
    symbol,
    transferEnabled,
    decimalUnits,
    tokenFactoryAddress,
    silent,
    debug,
  })
  return tasks.run().then((ctx) => {
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
