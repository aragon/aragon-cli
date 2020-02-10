import TaskList from 'listr'
import { blue, red, green, gray } from 'chalk'
import {
  getHttpClient,
  getMerkleDAG,
  extractCIDsFromMerkleDAG,
  propagateFiles,
  isValidCID,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
  isLocalDaemonRunning,
} from '@aragon/toolkit'
//
import listrOpts from '../../helpers/listr-options'
import { askForInput } from '../../util'

export const command = 'propagate [cid]'
export const describe =
  'Request the content and its links at several gateways, making the files more distributed within the network. Uses --ipfs-gateway.'

export const builder = yargs =>
  yargs.positional('cid', {
    description: 'A self-describing content-addressed identifier',
  })

export const runPropagateTask = ({ cid, ipfsReader, silent, debug }) => {
  return new TaskList(
    [
      {
        title: 'Start IPFS',
        skip: async () => isLocalDaemonRunning(),
        task: async () => {
          await startLocalDaemon(getBinaryPath(), getDefaultRepoPath(), {
            detached: false,
          })
        },
      },
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
        task: async (ctx, task) => {
          const handleProgress = (step, data) => {
            switch (step) {
              case 1:
                task.output = `Fetch DAG information for ${gray(data)}`
                break
              case 2:
                task.output = `Parse DAG information for ${gray(data)}`
                break
            }
          }

          ctx.data = await getMerkleDAG(ipfsReader, cid, {
            recursive: true,
            progressCallback: handleProgress,
          })
        },
      },
      {
        title: 'Query gateways',
        task: async (ctx, task) => {
          const handleProgress = (step, data) => {
            switch (step) {
              case 1: {
                const cid = gray(data.cid)
                const succeeded = green(data.succeeded)
                const failed = red(data.failed)
                task.output = `Queried ${cid} at ${succeeded} gateways successfully, ${failed} failed.`
                break
              }
            }
          }

          ctx.CIDs = extractCIDsFromMerkleDAG(ctx.data, {
            recursive: true,
          })

          ctx.result = await propagateFiles(ctx.CIDs, {
            progressCallback: handleProgress,
          })
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

  const { reporter, apm, debug, silent } = argv

  const ipfsReader = await getHttpClient(apm.ipfs.gateway)

  const ctx = await runPropagateTask({
    ipfsReader,
    cid,
    debug,
    silent,
  })

  reporter.message(
    '\n',
    `Queried ${blue(ctx.CIDs.length)} CIDs at ${blue(
      ctx.result.gateways.length
    )} gateways`,
    '\n',
    `Requests succeeded: ${green(ctx.result.succeeded)}`,
    '\n',
    `Requests failed: ${red(ctx.result.failed)}`,
    '\n'
  )

  reporter.debug(`Gateways: ${ctx.result.gateways.join(', ')}`)

  if (ctx.result.errors && ctx.result.errors.length) {
    reporter.debug(
      `Errors: \n${ctx.result.errors.map(JSON.stringify).join('\n')}`
    )
  }
  // TODO add your own gateways
}
