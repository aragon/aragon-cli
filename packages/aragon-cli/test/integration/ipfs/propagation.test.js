import test from 'ava'
import proxyquire from 'proxyquire'

const ipfsGateway = 'https://ipfs.eth.aragon.network/ipfs'
const readmeDirCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

test.beforeEach(t => {
  const propagation = proxyquire
    .noCallThru()
    .load('../../../src/lib/ipfs/propagation', {
      './constants': {
        timeout: () =>
          new Promise((resolve, reject) => setTimeout(resolve, 5 * 1000)),
        GATEWAYS: [ipfsGateway],
      },
    })

  t.context = {
    propagateFiles: propagation.propagateFiles,
  }
})

test('Get IPFS readme merkle DAG and CIDs', async t => {
  // arrange
  const { propagateFiles } = t.context

  // act
  const results = await propagateFiles([readmeDirCid])

  // assert
  t.deepEqual(results, {
    errors: [],
    failed: 0,
    gateways: [ipfsGateway],
    succeeded: 1,
  })
})
