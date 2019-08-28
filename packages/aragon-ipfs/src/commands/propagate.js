import TaskList from 'listr'
import chalk from 'chalk'
import { cid as isValidCID } from 'is-ipfs'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
import { askForInput } from '@aragon/cli-utils'
//
import {
  getClient,
  getMerkleDAG,
  extractCIDsFromMerkleDAG,
  propagateFiles,
} from '../lib'

export const command = 'propagate [cid]'
export const describe =
  'Request the content and its links at several gateways, making the files more distributed within the network. Uses --ipfs-gateway.'

export const builder = yargs =>
  yargs.positional('cid', {
    description: 'A self-describing content-addressed identifier',
  })

const runPropagateTask = ({ cid, ipfsReader, silent, debug }) => {
  return new TaskList(
    [
      {
        title: 'Validate CID',
        task: () => {
          if (!isValidCID(cid)) {
            throw new Error(`"${cid}" is not a valid content identifier.`)
          }
        },
      },
      {
        title: 'Fetch the links',
        task: async ctx => {
          ctx.data = await getMerkleDAG(ipfsReader, cid, {
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
  ).run()
}

export const handler = async argv => {
  /**
   * Interactive input
   */
  let { cid } = argv

  if (!cid) {
    cid = await askForInput('Choose a content identifier')
  }

  const { reporter, environment, debug, silent } = argv

  const ipfsReader = await getClient(environment.ipfsGateway)

  const ctx = await runPropagateTask({
    ipfsReader,
    cid,
    debug,
    silent,
  })

  reporter.message(
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
