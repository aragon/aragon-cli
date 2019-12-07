import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
//
import { getPorts, getPeerIDConfig } from '../../src/lib/ipfs'

test.beforeEach(t => {
  const fsExtra = {
    readJson: sinon.stub(),
  }

  const config = proxyquire.noCallThru().load('../../src/lib/ipfs/config', {
    'fs-extra': fsExtra,
  })

  t.context = {
    config,
    fsExtra,
  }
})

test.afterEach.always(() => {
  sinon.restore()
})

test('getRepoVersion should return the version of a repository', async t => {
  t.plan(1)
  // arrange
  const { config, fsExtra } = t.context
  fsExtra.readJson.returns(2008)
  // act
  const version = await config.getRepoVersion('/home/satoshi/.ipfs')
  // assert
  t.is(version, 2008)
})

const PeerID = 'QmQZCPSPhVvthk12345678r55gJgJGCLdfgas4aCS8jGcFt'
const ipfsConfig = {
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
    PeerID,
  },
}

test('Get ports from config JSON', t => {
  const ports = getPorts(ipfsConfig)
  t.deepEqual(ports, {
    api: '5001',
    gateway: '8080',
    swarm: '4001',
  })
})

test('Get peer ID from config JSON', t => {
  const peerId = getPeerIDConfig(ipfsConfig)
  t.is(peerId, PeerID)
})
