const TaskList = require('listr')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const { getContract } = require('../../util')
const listrOpts = require('../../helpers/listr-options')

exports.command =
  'token <token-name> <symbol> [decimal-units] [transfer-enabled]'

exports.describe = 'Create a new minime token'

exports.builder = yargs => {
  return yargs
    .positional('token-name', {
      description: 'Full name of the new Token',
    })
    .positional('symbol', {
      description: 'Symbol of the new Token',
    })
    .option('transfer-enabled', {
      description: 'Whether the new token will have transfers enabled',
      default: true,
    })
    .option('decimal-units', {
      description: 'Total decimal units the new token will use',
      default: 18,
    })
}

exports.task = async ({
  web3,
  reporter,
  tokenName,
  symbol,
  transferEnabled,
  decimalUnits,
  silent,
  debug,
}) => {
  let token

  const tasks = new TaskList(
    [
      {
        title: 'Deploy Token',
        task: async (ctx, task) => {
          try {
            let miniMeFactory = getContract('@aragon/os', 'MiniMeTokenFactory')
            let factory = await miniMeFactory.new()
            let miniMeToken = getContract('@aragon/os', 'MiniMeToken')
            token = await miniMeToken.new(
              factory.address,
              0x0,
              0,
              tokenName,
              decimalUnits,
              symbol,
              transferEnabled
            )
          } catch (e) {
            reporter.error('Error deploying token')
            reporter.debug(e)
            process.exit(1)
          }
          ctx.tokenAddress = token.address
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
}

exports.handler = async function({
  reporter,
  network,
  tokenName,
  symbol,
  transferEnabled,
  decimalUnits,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)

  const task = await exports.task({
    web3,
    reporter,
    tokenName,
    symbol,
    transferEnabled,
    decimalUnits,
    silent,
    debug,
  })
  return task.run().then(ctx => {
    reporter.success(`Successfully deployed token at ${ctx.tokenAddress}`)

    process.exit()
  })
}
