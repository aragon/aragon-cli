import test from 'ava'
import {
  getHttpClient,
  getMerkleDAG,
  extractCIDsFromMerkleDAG,
} from '../../src/lib/ipfs'

const ipfsGateway = 'http://localhost:8080'
const readmeDirCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

test('Get IPFS readme merkle DAG and CIDs', async t => {
  const ipfsReader = await getHttpClient(ipfsGateway)

  const merkleDag = await getMerkleDAG(ipfsReader, readmeDirCid)
  const cids = extractCIDsFromMerkleDAG(merkleDag, { recursive: true })

  t.snapshot(merkleDag, 'IPFS readme merkle DAG')
  t.snapshot(cids, 'IPFS readme CID list')
})

test('Get IPFS readme merkle DAG recursively', async t => {
  const ipfsReader = await getHttpClient(ipfsGateway)

  const merkleDag = await getMerkleDAG(ipfsReader, readmeDirCid, {
    recursive: true,
  })

  t.snapshot(merkleDag, 'IPFS readme merkle DAG recursive')
})
