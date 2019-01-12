const TaskList = require('listr')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const { getContract } = require('../../util')
const listrOpts = require('../../helpers/listr-options')

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

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
  let tokenAddress, factoryAddress

  // Decode sender
  const accounts = await web3.eth.getAccounts()
  const from = accounts[0]

  const tasks = new TaskList(
    [
      {
        title: 'Deploy Token',
        task: async (ctx, task) => {
          try {
            let miniMeFactory = getContract('@aragon/os', 'MiniMeTokenFactory')
            let factory = new web3.eth.Contract(miniMeFactory.abi)
            await factory
              .deploy({ data: '0x0' })
              .send({ from: from })
              .on('error', function(error) {
                throw error
              })
              .on('receipt', function(receipt) {
                factoryAddress = receipt.contractAddress
              })

            let miniMeToken = new web3.eth.Contract(
              getContract('@aragon/os', 'MiniMeToken').abi
            )
            await miniMeToken
              .deploy({
                data: '0x0',
                arguments: [
                  factoryAddress,
                  ZERO_ADDR,
                  0,
                  tokenName,
                  decimalUnits,
                  symbol,
                  transferEnabled,
                ],
              })
              .send({ from: from })
              .on('error', function(error) {
                throw error
              })
              .on('receipt', function(receipt) {
                tokenAddress = receipt.contractAddress
              })
          } catch (e) {
            reporter.error('Error deploying token test', e)
            reporter.error(e)
            reporter.debug(e)
            process.exit(1)
          }
          ctx.tokenAddress = tokenAddress
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
