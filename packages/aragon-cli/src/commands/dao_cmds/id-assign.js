import TaskList from 'listr'
import { ensureWeb3 } from '../../helpers/web3-fallback'
import { green } from 'chalk'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
import { isIdAssigned, assignId } from '../../lib/dao/assign-id'

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
            reporter.error(`${aragonId} is already assigned.`)
            process.exit(1)
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
  reporter.success(`${green(aragonId)} successfully assigned to ${dao}`)
  process.exit()
}
