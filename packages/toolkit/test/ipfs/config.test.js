import fs from 'fs-extra'
//
import { getPorts, getPeerIDConfig, getRepoVersion } from '../../src/ipfs'

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

beforeAll(() => {
  fs.mkdirpSync(IPFS_PATH)
  fs.writeFileSync(`${IPFS_PATH}/version`, IPFS_VERSION)
})

test('getRepoVersion should return the version of a repository', async () => {
  const version = await getRepoVersion(IPFS_PATH)
  expect(version).toBe(IPFS_VERSION)
})

test('Get ports from config JSON', () => {
  const ports = getPorts(IPFS_CONFIG_JSON)
  expect(ports).toEqual({
    api: '5001',
    gateway: '8080',
    swarm: '4001',
  })
})

test('Get peer ID from config JSON', () => {
  const peerId = getPeerIDConfig(IPFS_CONFIG_JSON)
  expect(peerId).toBe(PEER_ID)
})

test('removeSync(IPFS_PATH)', () => {
  fs.removeSync(IPFS_PATH)
})
