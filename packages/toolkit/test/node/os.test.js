import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

test.beforeEach(t => {
  const fsStub = {
    existsSync: sinon.stub(),
  }

  const node = proxyquire.noCallThru().load('../../src/node', {
    fs: fsStub,
  })

  t.context = {
    node,
    fsStub,
  }
})

test.afterEach.always(() => {
  sinon.restore()
})

// eslint-disable-next-line ava/no-skip-test
test.skip('getLocalBinary should find the binary path from the local node_modules', t => {
  t.plan(1)
  const { node, fsStub } = t.context

  // arrange
  fsStub.existsSync.returns(true)
  // act
  const path = node.getLocalBinary('truff', 'project_root')
  // assert
  t.is(normalizePath(path), 'project_root/node_modules/.bin/truff')
})

// eslint-disable-next-line ava/no-skip-test
test.skip('getLocalBinary should find the binary path from the parent node_modules', t => {
  t.plan(1)
  const { node, fsStub } = t.context

  // arrange
  fsStub.existsSync.onCall(0).returns(false)
  fsStub.existsSync.onCall(1).returns(true)
  // act
  const path = node.getLocalBinary('truff', 'parent/node_modules/project_root')
  // assert
  t.is(normalizePath(path), 'parent/node_modules/.bin/truff')
})

// eslint-disable-next-line ava/no-skip-test
test.skip("getLocalBinary should find the binary path from the parent node_modules even when it's scoped", t => {
  t.plan(1)
  const { node, fsStub } = t.context

  // arrange
  fsStub.existsSync.onCall(0).returns(false)
  fsStub.existsSync.onCall(1).returns(false)
  fsStub.existsSync.onCall(2).returns(true)
  // act
  const path = node.getLocalBinary(
    'truff',
    'parent/node_modules/@scope/project_root'
  )
  // assert
  t.is(normalizePath(path), 'parent/node_modules/.bin/truff')
})

function normalizePath(path) {
  // on Windows the directory separator is '\' not '/'
  const next = path.replace(/\\/g, '/')
  return next
}
