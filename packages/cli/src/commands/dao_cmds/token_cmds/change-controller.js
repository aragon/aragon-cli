import TaskList from 'listr'
import { blue, green } from 'chalk'
import { changeController } from '@aragon/toolkit'
//
import listrOpts from '../../../helpers/listr-options'

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

export const handler = async function({
  reporter,
  environment,
  tokenAddress,
  newController,
  silent,
  debug,
}) {
  let txReceipt

  const tasks = new TaskList(
    [
      {
        title: 'Changing the MiniMe token controller',
        task: async () => {
          txReceipt = await changeController(
            tokenAddress,
            newController,
            environment
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )

  await tasks.run()
  reporter.newLine()
  reporter.success(
    `Successfully changed the controller of ${green(tokenAddress)} to ${green(
      newController
    )}`
  )

  reporter.info(`Transaction hash: ${blue(txReceipt.transactionHash)}`)
}
