import test from 'ava'
import fs from 'fs-extra'
//
import {
  getPorts,
  getPeerIDConfig,
  getRepoVersion,
} from '../../../src/helpers/ipfs'

const IPFS_PATH = './.tmp/ipfs-tests/config'
const IPFS_VERSION = 3

const PEER_ID = 'QmQZCPSPhVvthk12345678r55gJgJGCLdfgas4aCS8jGcFt'
const IPFS_CONFIG_JSON = {
  API: {
    HTTPHeaders: {
      'Access-Control-Allow-Methods': ['PUT', 'GET', 'POST'],
      'Access-Control-Allow-Origin': ['*'],
    },
  },
  Addresses: {
    API: '/ip4/127.0.0.1/tcp/5001',
    Gateway: '/ip4/127.0.0.1/tcp/8080',
    Swarm: ['/ip4/0.0.0.0/tcp/4001', '/ip6/::/tcp/4001'],
  },
  Gateway: {
    HTTPHeaders: {
      'Access-Control-Allow-Methods': ['GET'],
      'Access-Control-Allow-Origin': ['*'],
    },
  },
  Identity: {
    PeerID: PEER_ID,
  },
}

test.before(t => {
  fs.mkdirpSync(IPFS_PATH)
  fs.writeFileSync(`${IPFS_PATH}/version`, IPFS_VERSION)
})

test.after.always(() => {
  fs.removeSync(IPFS_PATH)
})

test('getRepoVersion should return the version of a repository', async t => {
  const version = await getRepoVersion(IPFS_PATH)
  t.is(version, IPFS_VERSION)
})

test('Get ports from config JSON', t => {
  const ports = getPorts(IPFS_CONFIG_JSON)
  t.deepEqual(ports, {
    api: '5001',
    gateway: '8080',
    swarm: '4001',
  })
})

test('Get peer ID from config JSON', t => {
  const peerId = getPeerIDConfig(IPFS_CONFIG_JSON)
  t.is(peerId, PEER_ID)
})
