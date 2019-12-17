import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { convertDAOIdToSubdomain } from '@aragon/toolkit'
//
import { parseArgumentStringIfPossible } from '../src/util'

test.beforeEach(t => {
  const fsStub = {
    existsSync: sinon.stub(),
  }

  const { default: util } = proxyquire.noCallThru().load('../src/util', {
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

test('parseArgumentStringIfPossible should parse a boolean string', t => {
  t.is(parseArgumentStringIfPossible('true'), true)
  t.is(parseArgumentStringIfPossible('True'), true)
  t.is(parseArgumentStringIfPossible('TRUE'), true)
  t.is(parseArgumentStringIfPossible('false'), false)
  t.is(parseArgumentStringIfPossible('False'), false)
})

test('parseArgumentStringIfPossible should parse an array as string', t => {
  t.deepEqual(parseArgumentStringIfPossible('["test"]'), ['test'])
  t.deepEqual(parseArgumentStringIfPossible('[1, 2, "3"]'), [1, 2, '3'])
  t.deepEqual(parseArgumentStringIfPossible('["hello", 1, "true"]'), [
    'hello',
    1,
    'true',
  ])
})

test('convertDAOIdToSubdomain returns the correct format', t => {
  const daoId = 'dao1'
  t.is(convertDAOIdToSubdomain(daoId), `${daoId}.aragonid.eth`)
})

test('convertDAOIdToSubdomain returns the same value when called with a subdomain', t => {
  const daoId = 'daotest2.aragonid.eth'
  t.is(convertDAOIdToSubdomain(daoId), daoId)
})

test('convertDAOIdToSubdomain throws when called with an invalid DAO id', t => {
  const daoId = 'my dao'
  t.throws(() => convertDAOIdToSubdomain(daoId))
})
