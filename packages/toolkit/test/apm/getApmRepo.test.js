import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

// Value used in internal APM calls.
import { DEFAULT_IPFS_TIMEOUT } from '../../src/helpers/constants'

// Default values used to call getApmRepo(...).
const web3 = { name: 'web3' }
const apmRepoName = 'test.aragonpm.eth'
const apmRepoVersion = '0.1.2'
const apmOptions = {}
apmOptions['ens-registry'] = '0x1234512345123451234512345123451234512345'
const progressHandler = step => {}

/* Setup and cleanup */

test.beforeEach('setup', t => {
  const apmStub = sinon.stub()
  apmStub.returns({
    getVersion: async () => {},
    getLatestVersion: async () => {},
  })

  const { default: getApmRepo } = proxyquire
    .noCallThru()
    .load('../../src/apm/getApmRepo', {
      '@aragon/apm': apmStub,
    })

  t.context = {
    getApmRepo,
    apmStub,
  }
})

test.afterEach('cleanup', t => {
  sinon.restore()
})

/* Tests */

test('properly calls the progressHandler', async t => {
  const { getApmRepo } = t.context

  const progressHandlerSpy = sinon.spy()

  await getApmRepo(
    web3,
    apmRepoName,
    apmRepoVersion,
    apmOptions,
    progressHandlerSpy
  )

  t.true(progressHandlerSpy.calledTwice)
  t.true(progressHandlerSpy.getCall(0).calledWith(1))
  t.true(progressHandlerSpy.getCall(1).calledWith(2))
})

test('tolerates a progressHandler not being specified', async t => {
  const { getApmRepo } = t.context

  await getApmRepo(web3, apmRepoName, apmRepoVersion, apmOptions, undefined)

  t.pass()
})

test('calls apm.getVersion() with the correct parameters and returns the expected object', async t => {
  const { getApmRepo, apmStub } = t.context

  const getVersionResponse = { name: 'getVersionResponse' }
  const getVersion = sinon.stub()
  getVersion.returns(getVersionResponse)
  apmStub.returns({
    getVersion: getVersion,
    getLatestVersion: async () => {},
  })

  const info = await getApmRepo(
    web3,
    apmRepoName,
    apmRepoVersion,
    apmOptions,
    progressHandler
  )

  t.true(
    getVersion.calledOnceWith(
      apmRepoName,
      ['0', '1', '2'],
      DEFAULT_IPFS_TIMEOUT
    )
  )

  t.is(info, getVersionResponse)
})

test('calls apm.getLatestVersion() with the correct parameters and returns the expected object', async t => {
  const { getApmRepo, apmStub } = t.context

  const getVersionResponse = { name: 'getVersionResponse' }
  const getLatestVersion = sinon.stub()
  getLatestVersion.returns(getVersionResponse)
  apmStub.returns({
    getVersion: async () => {},
    getLatestVersion,
  })

  const info = await getApmRepo(
    web3,
    apmRepoName,
    'latest',
    apmOptions,
    progressHandler
  )

  t.true(getLatestVersion.calledOnceWith(apmRepoName, DEFAULT_IPFS_TIMEOUT))

  t.is(info, getVersionResponse)
})

test('APM constructor gets called with the appropriate parameters', async t => {
  const { getApmRepo, apmStub } = t.context

  await getApmRepo(
    web3,
    apmRepoName,
    apmRepoVersion,
    apmOptions,
    progressHandler
  )

  t.true(apmStub.calledOnceWith(web3, apmOptions))
})

test('fails if apmOptions does not contain an ens-registry property', async t => {
  const { getApmRepo } = t.context

  const emptyApmOptions = {}

  const error = await t.throwsAsync(async () => {
    await getApmRepo(
      web3,
      apmRepoName,
      apmRepoVersion,
      emptyApmOptions,
      progressHandler
    )
  })

  t.is(error.message, 'ens-registry not found in given apm options.')
})
