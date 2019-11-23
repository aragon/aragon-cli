import TaskList from 'listr'
import { ensureWeb3 } from '../../../helpers/web3-fallback'
import { getContract, getRecommendedGasLimit } from '../../../util'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
import chalk from 'chalk'

export const command = 'change-controller <token-address> <new-controller>'
export const describe = 'Change the controller of a MiniMe token'

export const builder = yargs => {
  return yargs
    .positional('token-address', {
      description: 'Address of the MiniMe token',
    })
    .positional('new-controller', {
      description: 'Address of the new controller',
    })
}

export const task = async ({
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
          const artifact = getContract(
            '@aragon/apps-shared-minime',
            'MiniMeToken'
          )
          const contract = new web3.eth.Contract(artifact.abi, tokenAddress)

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

export const handler = async function({
  reporter,
  gasPrice,
  network,
  tokenAddress,
  newController,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)

  const tasks = await task({
    web3,
    gasPrice,
    reporter,
    tokenAddress,
    newController,
    silent,
    debug,
  })
  return tasks.run().then(ctx => {
    reporter.success(
      `Successfully changed the controller of ${chalk.green(
        tokenAddress
      )} to ${chalk.green(newController)}`
    )
    reporter.info(`Transaction hash: ${chalk.blue(ctx.txHash)}`)

    process.exit()
  })
}
