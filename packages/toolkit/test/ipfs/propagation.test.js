import { propagateFiles } from '../../src/ipfs'

// eslint-disable-next-line ava/no-skip-test
test.skip('Get IPFS readme merkle DAG and CIDs', async () => {
  const ipfsGateway = 'https://ipfs.eth.aragon.network/ipfs'
  const readmeDirCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

  const results = await propagateFiles([readmeDirCid], {
    gateways: [ipfsGateway],
  })

  expect(results).toEqual({
    errors: [],
    failed: 0,
    gateways: [ipfsGateway],
    succeeded: 1,
  })
})
