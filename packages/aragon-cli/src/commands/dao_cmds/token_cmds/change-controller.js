const TaskList = require('listr')
const { ensureWeb3 } = require('../../../helpers/web3-fallback')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const chalk = require('chalk')
const { changeController } = require('../../../lib/token')

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
  let txReceipt

  const tasks = new TaskList(
    [
      {
        title: 'Changing the MiniMe token controller',
        task: async () => {
          txReceipt = await changeController(
            web3,
            tokenAddress,
            newController,
            gasPrice
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )

  await tasks.run()
  reporter.success(
    `Successfully changed the controller of ${chalk.green(
      tokenAddress
    )} to ${chalk.green(newController)}`
  )

  reporter.info(`Transaction hash: ${chalk.blue(txReceipt.transactionHash)}`)
  process.exit()
}
