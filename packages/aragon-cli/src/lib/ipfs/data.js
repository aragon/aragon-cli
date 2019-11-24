export function extractCIDsFromMerkleDAG(merkleDAG, opts = {}) {
  const CIDs = []
  CIDs.push(merkleDAG.cid)

  if (opts.recursive && merkleDAG.isDir && merkleDAG.links) {
    merkleDAG.links
      .map(merkleDAGOfLink => extractCIDsFromMerkleDAG(merkleDAGOfLink, opts))
      .map(CIDsOfLink => CIDs.push(...CIDsOfLink))
  }

  return CIDs
}

export function isDirectory(data) {
  return data.length === 2 && data.toString() === '\u0008\u0001'
}

// object.get returns an object of type DAGNode
// https://github.com/ipld/js-ipld-dag-pb#dagnode-instance-methods-and-properties
export function parseMerkleDAG(dagNode) {
  const parsed = dagNode.toJSON()
  // add relevant data
  parsed.isDir = isDirectory(parsed.data)
  // remove irrelevant data
  delete parsed.data
  if (!parsed.isDir) {
    // if it's a big file it will have links to its other chunks
    delete parsed.links
  }
  return parsed
}

export async function getMerkleDAG(client, cid, opts = {}) {
  const merkleDAG = parseMerkleDAG(await client.object.get(cid))
  merkleDAG.cid = cid

  if (opts.recursive && merkleDAG.isDir && merkleDAG.links) {
    // fetch the MerkleDAG of each link recursively
    const promises = merkleDAG.links.map(async link => {
      const object = await getMerkleDAG(client, link.cid, opts)
      return Object.assign(link, object)
    })

    return Promise.all(promises).then(links => {
      merkleDAG.links = links
      return merkleDAG
    })
  }

  return merkleDAG
}
