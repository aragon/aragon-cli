import TaskList from 'listr'
import { blue, green } from 'chalk'
import { changeController } from '@aragon/toolkit/dist/token/token'
//
import listrOpts from '../../../helpers/listr-options'

import { ensureWeb3 } from '../../../helpers/web3-fallback'

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
    `Successfully changed the controller of ${green(tokenAddress)} to ${green(
      newController
    )}`
  )

  reporter.info(`Transaction hash: ${blue(txReceipt.transactionHash)}`)
  process.exit()
}
