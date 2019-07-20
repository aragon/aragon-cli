import TaskList from 'listr'
//
import {
  ensureConnection,
  getMerkleDAG,
  extractCIDsFromMerkleDAG,
  propagateFiles,
} from '../../lib/ipfs'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'

const chalk = require('chalk')
const startIPFS = require('./start')

exports.command = 'propagate <cid>'
exports.describe =
  'Request the content and its links at several gateways, making the files more distributed within the network.'

exports.builder = yargs => {
  return yargs.positional('cid', {
    description: 'A self-describing content-addressed identifier',
  })
}

exports.task = ({ apmOptions, silent, debug, cid }) => {
  return new TaskList(
    [
      {
        title: 'Check IPFS',
        task: () => startIPFS.task({ apmOptions }),
      },
      {
        title: 'Connect to IPFS',
        task: async ctx => {
          ctx.ipfs = await ensureConnection(apmOptions.ipfs.rpc)
        },
      },
      {
        title: 'Fetch the links',
        task: async ctx => {
          ctx.data = await getMerkleDAG(ctx.ipfs.client, cid, {
            recursive: true,
          })
        },
      },
      {
        title: 'Query gateways',
        task: async (ctx, task) => {
          ctx.CIDs = extractCIDsFromMerkleDAG(ctx.data, {
            recursive: true,
          })

          const logger = text => (task.output = text)
          ctx.result = await propagateFiles(ctx.CIDs, logger)
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

exports.handler = async function({
  reporter,
  apm: apmOptions,
  cid,
  debug,
  silent,
}) {
  const task = await exports.task({
    reporter,
    apmOptions,
    cid,
    debug,
    silent,
  })

  const ctx = await task.run()

  console.log(
    '\n',
    `Queried ${chalk.blue(ctx.CIDs.length)} CIDs at ${chalk.blue(
      ctx.result.gateways.length
    )} gateways`,
    '\n',
    `Requests succeeded: ${chalk.green(ctx.result.succeeded)}`,
    '\n',
    `Requests failed: ${chalk.red(ctx.result.failed)}`,
    '\n'
  )

  reporter.debug(`Gateways: ${ctx.result.gateways.join(', ')}`)
  reporter.debug(
    `Errors: \n${ctx.result.errors.map(JSON.stringify).join('\n')}`
  )
  // TODO add your own gateways
}
