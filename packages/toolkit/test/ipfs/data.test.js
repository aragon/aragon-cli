import {
  getHttpClient,
  getMerkleDAG,
  extractCIDsFromMerkleDAG,
} from '../../src/ipfs'

const ipfsGateway = 'http://localhost:8080'
const readmeDirCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

jest.setTimeout(60000)
test('Get IPFS readme merkle DAG and CIDs', async () => {
  const ipfsReader = await getHttpClient(ipfsGateway)

  const merkleDag = await getMerkleDAG(ipfsReader, readmeDirCid)
  const cids = extractCIDsFromMerkleDAG(merkleDag, { recursive: true })

  expect(merkleDag).toMatchSnapshot('IPFS readme merkle DAG')
  expect(cids).toMatchSnapshot('IPFS readme CID list')
})

test('Get IPFS readme merkle DAG recursively', async () => {
  const ipfsReader = await getHttpClient(ipfsGateway)

  const merkleDag = await getMerkleDAG(ipfsReader, readmeDirCid, {
    recursive: true,
  })

  expect(merkleDag).toMatchSnapshot('IPFS readme merkle DAG recursive')
})
