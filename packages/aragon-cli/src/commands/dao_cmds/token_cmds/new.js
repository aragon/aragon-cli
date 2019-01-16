const TaskList = require('listr')
const { ensureWeb3 } = require('../../../helpers/web3-fallback')
const { getContract } = require('../../../util')
const listrOpts = require('../../../helpers/listr-options')
const chalk = require('chalk')

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

exports.command = 'new <token-name> <symbol> [decimal-units] [transfer-enabled]'

exports.describe = 'Create a new MiniMe token'

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
  // Decode sender
  const accounts = await web3.eth.getAccounts()
  const from = accounts[0]

  return new TaskList(
    [
      {
        title: 'Deploy the MiniMeTokenFactory contract',
        task: async (ctx, task) => {
          let artifact = getContract('@aragon/os', 'MiniMeTokenFactory')
          let contract = new web3.eth.Contract(artifact.abi)

          const deployTx = contract.deploy({ data: artifact.bytecode })
          const gas = await deployTx.estimateGas()

          const deployPromise = deployTx.send({ from, gas })
          deployPromise
            .on('receipt', function(receipt) {
              ctx.factoryAddress = receipt.contractAddress
            })
            .on('transactionHash', transactionHash => {
              ctx.factoryTxHash = transactionHash
            })
            .on('error', function(error) {
              throw error
            })

          task.output = `Waiting for the transaction to be mined...`
          return deployPromise
        },
      },
      {
        title: 'Deploy the MiniMeToken contract',
        task: async (ctx, task) => {
          let artifact = getContract('@aragon/os', 'MiniMeToken')
          let contract = new web3.eth.Contract(artifact.abi)

          const deployTx = contract.deploy({
            data: artifact.bytecode,
            arguments: [
              ctx.factoryAddress,
              ZERO_ADDR,
              0,
              tokenName,
              decimalUnits,
              symbol,
              transferEnabled,
            ],
          })
          const gas = await deployTx.estimateGas()

          const deployPromise = deployTx.send({ from, gas: gas + 1e6 })
          deployPromise
            .on('receipt', function(receipt) {
              ctx.tokenAddress = receipt.contractAddress
            })
            .on('transactionHash', transactionHash => {
              ctx.tokenTxHash = transactionHash
            })
            .on('error', function(error) {
              throw error
            })

          task.output = `Waiting for the transaction to be mined...`
          return deployPromise
        },
      },
    ],
    listrOpts(silent, debug)
  )
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
    reporter.success(
      `Successfully deployed the token at ${chalk.bold(ctx.tokenAddress)}`
    )
    reporter.info(`Token transaction hash: ${ctx.tokenTxHash}`)

    reporter.success(
      `Successfully deployed the token factory at ${chalk.bold(
        ctx.factoryAddress
      )}`
    )
    reporter.info(`Token factory transaction hash: ${ctx.factoryTxHash}`)

    process.exit()
  })
}
