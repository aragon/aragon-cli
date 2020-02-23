import TaskList from 'listr'
import { gray } from 'chalk'
import { useEnvironment } from '@aragon/toolkit'
//
import {
  getMerkleDAG,
  stringifyMerkleDAG,
  getHttpClient,
  startLocalDaemon,
  isLocalDaemonRunning,
  isValidCID,
  getBinaryPath,
  getDefaultRepoPath,
} from '../../lib/ipfs'
import listrOpts from '../../helpers/listr-options'
import { askForInput } from '../../util'

export const command = 'view [cid]'
export const describe =
  'Show metadata about the content: size, links, etc. Uses --ipfs-gateway.'

export const builder = yargs =>
  yargs.positional('cid', {
    // TODO add support for "ipfs paths", e.g: QmP49YSJVhQTySqLDFTzFZPG8atf3CLsQSPDVj3iATQkhC/arapp.json
    description: 'A self-describing content-addressed identifier',
  })

const runViewTask = ({ cid, ipfsReader, silent, debug }) => {
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
          ctx.merkleDAG = await getMerkleDAG(ipfsReader, cid, {
            recursive: true,
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

  const { reporter, environment, debug, silent } = argv

  const { apmOptions } = useEnvironment(environment)

  const ipfsReader = await getHttpClient(apmOptions.ipfs.gateways)

  const ctx = await runViewTask({
    cid,
    ipfsReader,
    reporter,
    debug,
    silent,
  })

  // reporter.message(stringifyMerkleDAG(ctx.merkleDAG))
  console.log(stringifyMerkleDAG(ctx.merkleDAG))
}
