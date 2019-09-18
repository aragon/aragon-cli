const TaskList = require('listr')
const ENS = require('ethereum-ens')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const { green } = require('chalk')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const { isAddress } = require('web3-utils')
const registrarAbi = require('./abi/id/IFIFSResolvingRegistrar').abi
const { sha3 } = require('web3-utils')

const ARAGON_DOMAIN = 'aragonid.eth'

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

  const tasks = new TaskList(
    [
      {
        title: 'Validating Id',
        task: async ctx => {
          if (
            !/^([\w-]+)$/.test(aragonId) &&
            !new RegExp(`^([\\w-]+).${ARAGON_DOMAIN}$`).test(aragonId)
          ) {
            reporter.error('Invalid Aragon Id')
            process.exit(1)
          }

          const ens = (ctx.ens = new ENS(
            web3.currentProvider,
            apmOptions['ens-registry']
          ))

          ctx.domain = aragonId.includes(ARAGON_DOMAIN)
            ? aragonId
            : `${aragonId}.${ARAGON_DOMAIN}`

          // Check name doesn't already exist
          try {
            const exists = await ens.resolver(ctx.domain).addr()

            if (exists) {
              reporter.error(
                `Cannot assign: ${ctx.domain} is already assigned to ${exists}.`
              )
              process.exit(1)
            }
          } catch (err) {
            // ens.resolver() throws an ENS.NameNotFound error if name doesn't exist
            if (err !== ENS.NameNotFound) throw err
          }
        },
      },
      {
        title: 'Assigning Id',
        task: async ctx => {
          const registrar = new web3.eth.Contract(
            registrarAbi,
            await ctx.ens.owner(ARAGON_DOMAIN)
          )

          ctx.receipt = await registrar.methods
            .register(sha3(aragonId), dao)
            .send({
              from: (await web3.eth.getAccounts())[0],
              gas: '1000000',
              gasPrice: gasPrice,
            })
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
