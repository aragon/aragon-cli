import { noop } from '../node'

export function extractCIDsFromMerkleDAG(merkleDAG, options = {}) {
  const CIDs = []
  CIDs.push(merkleDAG.cid)

  if (options.recursive && merkleDAG.isDir && merkleDAG.links) {
    merkleDAG.links
      .map((merkleDAGOfLink) =>
        extractCIDsFromMerkleDAG(merkleDAGOfLink, options)
      )
      .map((CIDsOfLink) => CIDs.push(...CIDsOfLink))
  }

  return CIDs
}

export function isDirectory(data) {
  return data.length === 2 && data.toString() === '\u0008\u0001'
}

// object.get returns an object of type DAGNode
// https://github.com/ipld/js-ipld-dag-pb#dagnode-instance-methods-and-properties
export function parseMerkleDAG(cid, dagNode) {
  const parsed = dagNode.toJSON()
  // add relevant data
  parsed.cid = cid
  parsed.isDir = isDirectory(parsed.data)
  // remove irrelevant data
  delete parsed.data
  if (!parsed.isDir) {
    // if it's a big file it will have links to its other chunks
    delete parsed.links
  }
  return parsed
}

export async function getMerkleDAG(client, cid, options = {}) {
  const { recursive, progressCallback = noop } = options

  progressCallback(1, cid)
  const ipfsObj = await client.object.get(cid)
  progressCallback(2, cid)
  const merkleDAG = parseMerkleDAG(cid, ipfsObj)

  if (recursive && merkleDAG.isDir && merkleDAG.links) {
    // fetch the MerkleDAG of each link recursively
    for (const link of merkleDAG.links) {
      const object = await getMerkleDAG(client, link.cid, options)
      Object.assign(link, object)
    }
  }

  return merkleDAG
}
