import test from 'ava'
import sinon from 'sinon'
import getApmRepo from '../../src/apm/getApmRepo'

// Value used in internal APM calls.
import { DEFAULT_IPFS_TIMEOUT } from '../../src/helpers/constants'

let web3
let apmRegistryName, apmOptions
let progressHandler
let packages

/* Setup and cleanup */

test.before('setup and make a successful call', async t => {
  web3 = await getLocalWeb3()

  apmRegistryName = getApmRegistryName()
  apmOptions = getApmOptions()

  progressHandler = sinon.spy()

  packages = await getApmRepo(
    web3,
    apmRegistryName,
    apmOptions,
    progressHandler
  )
  await getApmRepo(
    web3,
    apmRepoName,
    apmRepoVersion,
    emptyApmOptions,
    progressHandler
  )
})

/* Tests */

test('properly calls the progressHandler', async t => {
  t.true(progressHandlerSpy.calledTwice)
  t.true(progressHandlerSpy.getCall(0).calledWith(1))
  t.true(progressHandlerSpy.getCall(1).calledWith(2))
})

// test('calls apm.getVersion() with the correct parameters and returns the expected object', async t => {
//   const { getApmRepo, apmStub } = t.context

//   const getVersionResponse = { name: 'getVersionResponse' }
//   const getVersion = sinon.stub()
//   getVersion.returns(getVersionResponse)
//   apmStub.returns({
//     getVersion: getVersion,
//     getLatestVersion: async () => {},
//   })

//   const info = await getApmRepo(
//     web3,
//     apmRepoName,
//     apmRepoVersion,
//     apmOptions,
//     progressHandler
//   )

//   t.true(
//     getVersion.calledOnceWith(
//       apmRepoName,
//       ['0', '1', '2'],
//       DEFAULT_IPFS_TIMEOUT
//     )
//   )

//   t.is(info, getVersionResponse)
// })

// test('calls apm.getLatestVersion() with the correct parameters and returns the expected object', async t => {
//   const { getApmRepo, apmStub } = t.context

//   const getVersionResponse = { name: 'getVersionResponse' }
//   const getLatestVersion = sinon.stub()
//   getLatestVersion.returns(getVersionResponse)
//   apmStub.returns({
//     getVersion: async () => {},
//     getLatestVersion,
//   })

//   const info = await getApmRepo(
//     web3,
//     apmRepoName,
//     'latest',
//     apmOptions,
//     progressHandler
//   )

//   t.true(getLatestVersion.calledOnceWith(apmRepoName, DEFAULT_IPFS_TIMEOUT))

//   t.is(info, getVersionResponse)
// })

// test('APM constructor gets called with the appropriate parameters', async t => {
//   const { getApmRepo, apmStub } = t.context

//   await getApmRepo(
//     web3,
//     apmRepoName,
//     apmRepoVersion,
//     apmOptions,
//     progressHandler
//   )

//   t.true(apmStub.calledOnceWith(web3, apmOptions))
// })

test('fails if apmOptions does not contain an ens-registry property', async t => {
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
