import test from 'ava'
import {
  getClient,
  getMerkleDAG,
  extractCIDsFromMerkleDAG,
} from '../../../src/lib/ipfs'

const ipfsGateway = 'https://ipfs.infura.io:5001'
const readmeDirCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

test.beforeEach(async t => {
  t.context = {
    ipfsReader: await getClient(ipfsGateway),
  }
})

/**
 * There seems to be a problem with 'ipfs-http-client' code when running
 * the test in node versions 8, and 9.
 *
 *
 * Could not connect to the IPFS API at "https://ipfs.infura.io:5001"
 *
 * connectOrThrow (src/lib/ipfs/misc.js:33:11)
 * getClient (src/lib/ipfs/misc.js:11:10)
 * _ava.default.beforeEach (test/integration/ipfs/data.test.js:13:23)
 *
 *
 * When inspecting the real error that throws:
 *
 *
 * /home/lion/Code/aragon/aragon-cli/packages/aragon-cli/node_modules/ipfs-http-client/src/files-regular/index.js:60
 *      for await (const entry of get(path, options)) {
 *          ^^^^^
 * SyntaxError: Unexpected reserved word
 *    at createScript (vm.js:80:10)
 *    at Object.runInThisContext (vm.js:139:10)
 *    at Module._compile (module.js:616:28)
 *    at Module._compile (/home/lion/Code/aragon/aragon-cli/packages/aragon-cli/node_modules/pirates/lib/index.js:99:24)
 *    at Module._extensions..js (module.js:663:10)
 *    at extensions.(anonymous function) (/home/lion/Code/aragon/aragon-cli/packages/aragon-cli/node_modules/require-precompiled/index.js:16:3)
 *    at newLoader (/home/lion/Code/aragon/aragon-cli/packages/aragon-cli/node_modules/pirates/lib/index.js:104:7)
 *    at Object.require.extensions.(anonymous function) [as .js] (/home/lion/Code/aragon/aragon-cli/packages/aragon-cli/node_modules/ava/lib/worker/dependency-tracker.js:42:4)
 *    at Module.load (module.js:565:32)
 *    at tryModuleLoad (module.js:505:12)
 *
 *
 * Note that the IPFS rpc object is correct, =
 * { protocol: 'https', host: 'ipfs.infura.io', port: 5001 }
 */

/* eslint-disable-next-line ava/no-skip-test */
test.skip('Get IPFS readme merkle DAG and CIDs', async t => {
  // arrange
  const { ipfsReader } = t.context

  // act
  const merkleDag = await getMerkleDAG(ipfsReader, readmeDirCid)
  const cids = extractCIDsFromMerkleDAG(merkleDag)

  // assert
  t.snapshot(merkleDag, 'IPFS readme merkle DAG')
  t.snapshot(cids, 'IPFS readme CID list')
})
