import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

test.beforeEach(t => {
  const fsExtra = {
    readJson: sinon.stub(),
  }

  const config = proxyquire.noCallThru().load('./config', {
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
