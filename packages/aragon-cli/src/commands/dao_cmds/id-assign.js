const TaskList = require('listr')
const { green } = require('chalk')
const { isIdAssigned, assignId } = require('@aragon/toolkit/dist/dao/assign-id')
//
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const listrOpts = require('../../helpers/listr-options')

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
exports.command = 'id <dao> <aragon-id>'
exports.describe = 'Shortcut for `dao id assign`'

exports.builder = yargs => {
  return idAssignBuilder(yargs).command(
    idAssignCommand,
    idAssignDescribe,
    idAssignBuilder,
    exports.handler
  )
}

exports.handler = async function({
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
}
