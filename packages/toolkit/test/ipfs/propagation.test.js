import test from 'ava'
//
import { propagateFiles } from '../../src/ipfs'

test('Get IPFS readme merkle DAG and CIDs', async t => {
  // arrange
  const ipfsGateway = 'https://ipfs.eth.aragon.network/ipfs'
  const readmeDirCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
  // act
  const results = await propagateFiles([readmeDirCid], {
    gateways: [ipfsGateway],
  })

  // assert
  t.deepEqual(results, {
    errors: [],
    failed: 0,
    gateways: [ipfsGateway],
    succeeded: 1,
  })
})
