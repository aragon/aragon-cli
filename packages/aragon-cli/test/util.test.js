import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

test.beforeEach(t => {
  const fsStub = {
    existsSync: sinon.stub(),
  }

  const util = proxyquire.noCallThru().load('../src/util', {
    fs: fsStub,
  })

  t.context = {
    util,
    fsStub,
  }
})

test.afterEach.always(() => {
  sinon.restore()
})

test('getDependentBinary should find the binary path from the local node_modules', t => {
  t.plan(1)
  const { util, fsStub } = t.context

  // arrange
  fsStub.existsSync.returns(true)
  // act
  const path = util.getDependentBinary('truff', 'project_root')
  // assert
  t.is(path, 'project_root/node_modules/.bin/truff')
})

test('getDependentBinary should find the binary path from the parent node_modules', t => {
  t.plan(1)
  const { util, fsStub } = t.context

  // arrange
  fsStub.existsSync.onCall(0).returns(false)
  fsStub.existsSync.onCall(1).returns(true)
  // act
  const path = util.getDependentBinary(
    'truff',
    'parent/node_modules/project_root'
  )
  // assert
  t.is(path, 'parent/node_modules/.bin/truff')
})

test("getDependentBinary should find the binary path from the parent node_modules even when it's scoped", t => {
  t.plan(1)
  const { util, fsStub } = t.context

  // arrange
  fsStub.existsSync.onCall(0).returns(false)
  fsStub.existsSync.onCall(1).returns(false)
  fsStub.existsSync.onCall(2).returns(true)
  // act
  const path = util.getDependentBinary(
    'truff',
    'parent/node_modules/@scope/project_root'
  )
  // assert
  t.is(path, 'parent/node_modules/.bin/truff')
})
