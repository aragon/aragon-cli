import TaskList from 'listr'
//
import {
  ensureConnection,
  getMerkleDAG,
  stringifyMerkleDAG,
} from '../../lib/ipfs'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'

const startIPFS = require('./start')

exports.command = 'view <cid>'
exports.describe =
  'Display metadata about the content, such as size, links, etc.'

exports.builder = yargs => {
  // TODO add support for "ipfs paths", e.g: QmP49YSJVhQTySqLDFTzFZPG8atf3CLsQSPDVj3iATQkhC/arapp.json
  return yargs.positional('cid', {
    description: 'A self-describing content-addressed identifier',
  })
}

exports.task = ({ apmOptions, silent, debug, cid }) => {
  return new TaskList(
    [
      // TODO validation of the CID
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
          ctx.merkleDAG = await getMerkleDAG(ctx.ipfs.client, cid, {
            recursive: true,
          })
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
  console.log(stringifyMerkleDAG(ctx.merkleDAG))
}
