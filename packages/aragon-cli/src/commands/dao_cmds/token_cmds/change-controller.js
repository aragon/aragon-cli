const TaskList = require('listr')
const { ensureWeb3 } = require('../../../helpers/web3-fallback')
const { getContract } = require('../../../util')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const chalk = require('chalk')
const { getRecommendedGasLimit } = require('../../../util')

exports.command = 'change-controller <token-address> <new-controller>'

exports.describe = 'Change the controller of a MiniMe token'

exports.builder = yargs => {
  return yargs
    .positional('token-address', {
      description: 'Address of the MiniMe token',
    })
    .positional('new-controller', {
      description: 'Address of the new controller',
    })
}

exports.task = async ({
  web3,
  gasPrice,
  tokenAddress,
  newController,
  silent,
  debug,
}) => {
  // Decode sender
  const accounts = await web3.eth.getAccounts()
  const from = accounts[0]

  return new TaskList(
    [
      {
        title: 'Changing the MiniMe token controller',
        task: async (ctx, task) => {
          let artifact = getContract(
            '@aragon/apps-shared-minime',
            'MiniMeToken'
          )
          let contract = new web3.eth.Contract(artifact.abi, tokenAddress)

          const tx = contract.methods.changeController(newController)
          // this fails if from is not passed
          const gas = await getRecommendedGasLimit(
            web3,
            await tx.estimateGas({ from })
          )

          const sendPromise = tx.send({ from, gas, gasPrice })
          sendPromise
            .on('transactionHash', transactionHash => {
              ctx.txHash = transactionHash
            })
            .on('error', function(error) {
              throw error
            })

          task.output = `Waiting for the transaction to be mined...`
          return sendPromise
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

exports.handler = async function({
  reporter,
  gasPrice,
  network,
  tokenAddress,
  newController,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)

  const task = await exports.task({
    web3,
    gasPrice,
    reporter,
    tokenAddress,
    newController,
    silent,
    debug,
  })
  return task.run().then(ctx => {
    reporter.success(
      `Successfully changed the controller of ${chalk.green(
        tokenAddress
      )} to ${chalk.green(newController)}`
    )
    reporter.info(`Transaction hash: ${chalk.blue(ctx.txHash)}`)

    process.exit()
  })
}
