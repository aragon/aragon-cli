import TaskList from 'listr'
import { green } from 'chalk'
import { isIdAssigned, assignId } from '@aragon/toolkit/dist/dao/assign-id'
//
import { ensureWeb3 } from '../../helpers/web3-fallback'

import listrOpts from '../../helpers/listr-options'

// dao id assign command
const idAssignCommand = 'assign <dao> <aragon-id>'
const idAssignDescribe = 'Assign an Aragon Id to a DAO address'
const idAssignBuilder = yargs => {
  return yargs
    .positional('dao', {
      description: 'DAO address',
      type: 'string',
    })
    .positional('aragon-id', {
      description: 'Aragon Id',
      type: 'string',
    })
}

// dao id shortcut
export const command = 'id <dao> <aragon-id>'

export const describe = 'Shortcut for `dao id assign`'

export const builder = yargs => {
  return idAssignBuilder(yargs).command(
    idAssignCommand,
    idAssignDescribe,
    idAssignBuilder,
    exports.handler
  )
}

export const handler = async function({
  aragonId,
  reporter,
  network,
  apm: apmOptions,
  dao,
  gasPrice,
  silent,
  debug,
}) {
  const web3 = await ensureWeb3(network)
  const options = { web3, ensRegistry: apmOptions['ens-registry'] }

  const tasks = new TaskList(
    [
      {
        title: 'Validating Id',
        task: async () => {
          if (await isIdAssigned(aragonId, options)) {
            throw Error(`${aragonId} is already assigned.`)
          }
        },
      },
      {
        title: 'Assigning Id',
        task: async () => assignId(dao, aragonId, { ...options, gasPrice }),
      },
    ],
    listrOpts(silent, debug)
  )

  await tasks.run()
  reporter.newLine()
  reporter.success(`${green(aragonId)} successfully assigned to ${dao}`)
}
