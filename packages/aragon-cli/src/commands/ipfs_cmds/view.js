import TaskList from 'listr'
//
import { ensureIPFS, getMerkleDAG, stringifyMerkleDAG } from '../../lib/ipfs'
import listrOpts from '../../helpers/listr-options'

exports.command = 'view <cid>'
exports.describe =
  'Fetch information about an IPFS cid such as size, links, etc.'

exports.builder = yargs => {
  // TODO add support for "ipfs paths", e.g: QmP49YSJVhQTySqLDFTzFZPG8atf3CLsQSPDVj3iATQkhC/arapp.json
  return yargs.positional('cid', {
    description: 'IPFS cid of the file',
  })
}

exports.task = ({ apmOptions, silent, debug, cid }) => {
  return new TaskList(
    [
      // TODO validation of the CID
      {
        title: 'Connect to IPFS',
        task: async ctx => {
          ctx.ipfs = await ensureIPFS(apmOptions.ipfs.rpc)
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
