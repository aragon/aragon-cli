import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

/* Default values */

const web3 = { name: 'web3' }
const apmRegistryName = 'test.aragonpm.eth'
const apmOptions = {}
apmOptions['ens-registry'] = '0x1234512345123451234512345123451234512345'
const progressHandler = (step) => {}

/* Setup and cleanup */

test.beforeEach('setup', t => {
  const apmStub = sinon.stub()
  apmStub.returns({
    getRepoRegistry: async () => {
      return { getPastEvents: () => [] }
    },
    getLatestVersion: async () => {}
  })

  const grantNewVersionsPermission = proxyquire.noCallThru().load('../../../src/lib/apm/grantNewVersionsPermission', {
    '@aragon/apm': apmStub,
  })

  t.context = {
    grantNewVersionsPermission,
    apmStub
  }
})

test.afterEach('cleanup', t => {
  sinon.restore()
})

/* Tests */

// test('properly calls the progressHandler', async t => {
//   const { grantNewVersionsPermission } = t.context

//   const progressHandlerSpy = sinon.spy()

//   await grantNewVersionsPermission(
//     web3,
//     apmRegistryName,
//     apmOptions,
//     progressHandlerSpy
//   )

//   t.is(progressHandlerSpy.callCount, 5)
//   t.true(progressHandlerSpy.getCall(0).calledWith(1))
//   t.true(progressHandlerSpy.getCall(1).calledWith(2))
//   t.true(progressHandlerSpy.getCall(2).calledWith(3))
//   t.true(progressHandlerSpy.getCall(3).calledWith(4))
//   t.true(progressHandlerSpy.getCall(4).calledWith(5))
// })

// test('tolerates a progressHandler not being specified', async t => {
//   const { grantNewVersionsPermission } = t.context

//   await grantNewVersionsPermission(
//     web3,
//     apmRegistryName,
//     apmOptions,
//     undefined
//   )

//   t.pass()
// })

// test('if events are retrieved, calls apm.getLatestVersion() correctly, and retrieves the appropriate packages object', async t => {
//   const { grantNewVersionsPermission, apmStub } = t.context

//   const packageName = 'aPackage'
//   const packageVersion = '0.1.2'

//   const getLatestVersion = sinon.stub()
//   getLatestVersion.returns({ version: packageVersion })

//   const aNewRepoEvent = {
//     returnValues: {
//       name: packageName,
//       id: '0x123'
//     }
//   }

//   apmStub.returns({
//     getRepoRegistry: async () => {
//       return { getPastEvents: async () => [ aNewRepoEvent ] }
//     },
//     getLatestVersion
//   })

//   const packages = await grantNewVersionsPermission(
//     web3,
//     apmRegistryName,
//     apmOptions,
//     progressHandler
//   )

//   t.true(
//     getLatestVersion.calledOnceWith(
//       aNewRepoEvent.returnValues.id
//     )
//   )

//   const aPackage = packages[0]
//   t.is(aPackage.name, packageName)
//   t.is(aPackage.version, packageVersion)
// })

// test('if no events are retrieved, does not call apm.getLatestVersion()', async t => {
//   const { grantNewVersionsPermission, apmStub } = t.context

//   const getLatestVersion = sinon.stub()

//   apmStub.returns({
//     getRepoRegistry: async () => {
//       return { getPastEvents: () => [] }
//     },
//     getLatestVersion
//   })

//   await grantNewVersionsPermission(
//     web3,
//     apmRegistryName,
//     apmOptions,
//     progressHandler
//   )

//   t.true(
//     getLatestVersion.notCalled
//   )
// })

// test('calls registry.getPastEvents() with the correct parameters', async t => {
//   const { grantNewVersionsPermission, apmStub } = t.context

//   const getPastEvents = sinon.stub()
//   getPastEvents.returns([])

//   apmStub.returns({
//     getRepoRegistry: async () => {
//       return { getPastEvents }
//     },
//     getLatestVersion: () => {}
//   })

//   await grantNewVersionsPermission(
//     web3,
//     apmRegistryName,
//     apmOptions,
//     progressHandler
//   )

//   t.true(
//     getPastEvents.calledOnceWith(
//       'NewRepo',
//       { fromBlock: 0 }
//     )
//   )
// })

// test('calls apm.getRepoRegistry() with the correct parameters', async t => {
//   const { grantNewVersionsPermission, apmStub } = t.context

//   const getRepoRegistry = sinon.stub()
//   getRepoRegistry.returns({ getPastEvents: () => [] })

//   apmStub.returns({
//     getRepoRegistry,
//     getLatestVersion: async () => {}
//   })

//   await grantNewVersionsPermission(
//     web3,
//     apmRegistryName,
//     apmOptions,
//     progressHandler
//   )

//   t.true(
//     getRepoRegistry.calledOnceWith(
//       `vault.${apmRegistryName}`
//     )
//   )
// })

// test('APM constructor gets called with the appropriate parameters', async t => {
//   const { grantNewVersionsPermission, apmStub } = t.context

//   await grantNewVersionsPermission(
//     web3,
//     apmRegistryName,
//     apmOptions,
//     progressHandler
//   )

//   t.true(
//     apmStub.calledOnceWith(
//       web3,
//       apmOptions
//     )
//   )
// })

test('fails if apmOptions does not contain an ens-registry property', async t => {
  const { grantNewVersionsPermission } = t.context

  const emptyApmOptions = {}

  const error = await t.throwsAsync(
    async () => {
      await grantNewVersionsPermission(
        web3,
        apmRegistryName,
        emptyApmOptions,
        progressHandler
      )
    }
  )

  t.is(error.message, 'ens-registry not found in given apm options.')
})
