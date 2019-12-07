import test from 'ava'
//
import {
  getClient,
  getMerkleDAG,
  extractCIDsFromMerkleDAG,
} from '../../src/lib/ipfs'

const ipfsGateway = 'https://ipfs.infura.io:5001'
const readmeDirCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

test.beforeEach(async t => {
  t.context = {
    ipfsReader: await getClient(ipfsGateway),
  }
})

test('Get IPFS readme merkle DAG and CIDs', async t => {
  // arrange
  const { ipfsReader } = t.context

  // act
  const merkleDag = await getMerkleDAG(ipfsReader, readmeDirCid)
  const cids = extractCIDsFromMerkleDAG(merkleDag, { recursive: true })

  // assert
  t.snapshot(merkleDag, 'IPFS readme merkle DAG')
  t.snapshot(cids, 'IPFS readme CID list')
})
