import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

test.beforeEach(t => {
  const fsExtraStub = {
    readJson: sinon.stub(),
  }

  const ipfsLib = proxyquire.noCallThru().load('../../src/lib/ipfs', {
    'fs-extra': fsExtraStub,
  })

  t.context = {
    ipfsLib,
    fsExtraStub,
  }
})

test.afterEach.always(() => {
  sinon.restore()
})

test('getRepoVersion should return the version of a repository', async t => {
  t.plan(1)
  // arrange
  const { ipfsLib, fsExtraStub } = t.context
  fsExtraStub.readJson.returns(2008)
  // act
  const version = await ipfsLib.getRepoVersion('/home/satoshi/.ipfs')
  // assert
  t.is(version, 2008)
})
