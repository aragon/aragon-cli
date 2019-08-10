const TaskList = require('listr')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const { green } = require('chalk')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const { isAddress } = require('web3-utils')
const assignId = require('./utils/assign-id')

exports.command = 'assign-id <dao> <aragon-id>'

exports.describe = 'Assign an Aragon Id to a DAO address'

exports.builder = yargs => {
  return yargs
    .positional('dao', {
      description: 'Address of the Kernel',
      type: 'string',
    })
    .positional('aragon-id', {
      description: 'Aragon Id',
      type: 'string',
    })
}

exports.task = async ({
  dao,
  aragonId,
  web3,
  gasPrice,
  apmOptions,
  silent,
  debug,
  reporter,
}) => {
  if (!isAddress(dao)) {
    reporter.error('Invalid DAO address')
    process.exit(1)
  }

  if (!/^([\w-]+)$/.test(aragonId)) {
    reporter.error('Invalid Aragon Id')
    process.exit(1)
  }

  const tasks = new TaskList(
    [
      {
        title: 'Assigning Aragon Id',
        task: async ctx => {
          ctx.receipt = await assignId({
            id: aragonId,
            orgAddress: dao,
            ensRegistryAddress: apmOptions['ens-registry'],
            gasPrice,
            web3,
          })
          ctx.domain = `${aragonId}.aragonid.eth`
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
}

exports.handler = async function({
  aragonId,
  reporter,
  network,
  apm: apmOptions,
  dao,
  gasPrice,
}) {
  const web3 = await ensureWeb3(network)

  const task = await exports.task({
    aragonId,
    dao,
    web3,
    reporter,
    network,
    apmOptions,
    gasPrice,
  })
  return task.run().then(ctx => {
    reporter.success(`${green(ctx.domain)} successfully assigned to ${dao}`)
    process.exit()
  })
}
