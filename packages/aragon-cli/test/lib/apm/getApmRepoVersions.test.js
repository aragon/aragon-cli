import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

// Default values used to call getApmVersions(...).
const web3 = { name: 'web3' }
const apmRepoName = 'test.aragonpm.eth'
const apmOptions = {}
apmOptions['ens-registry'] = '0x1234512345123451234512345123451234512345'

/* Setup and cleanup */

test.beforeEach('setup', t => {
  const apmStub = sinon.stub()
  apmStub.returns({
    getAllVersions: async () => {},
  })

  const { default: getApmRepoVersions } = proxyquire
    .noCallThru()
    .load('../../../src/lib/apm/getApmRepoVersions', {
      '@aragon/apm': apmStub,
    })

  t.context = {
    getApmRepoVersions,
    apmStub,
  }
})

test.afterEach('cleanup', t => {
  sinon.restore()
})

/* Tests */

test('calls apm.getAllVersions() with the correct parameters and returns the expected object', async t => {
  const { getApmRepoVersions, apmStub } = t.context

  const getAllVersionsResponse = { name: 'allVersions' }
  const getAllVersions = sinon.stub()
  getAllVersions.returns(getAllVersionsResponse)
  apmStub.returns({
    getAllVersions,
  })

  const versions = await getApmRepoVersions(web3, apmRepoName, apmOptions)

  t.true(getAllVersions.calledOnceWith(apmRepoName))

  t.is(versions, getAllVersionsResponse)
})

test('APM constructor gets called with the appropriate parameters', async t => {
  const { getApmRepoVersions, apmStub } = t.context

  await getApmRepoVersions(web3, apmRepoName, apmOptions)

  t.true(apmStub.calledOnceWith(web3, apmOptions))
})

test('fails if apmOptions does not contain an ens-registry property', async t => {
  const { getApmRepoVersions } = t.context

  const emptyApmOptions = {}

  const error = await t.throwsAsync(async () => {
    await getApmRepoVersions(web3, apmRepoName, emptyApmOptions)
  })

  t.is(error.message, 'ens-registry not found in given apm options.')
})
