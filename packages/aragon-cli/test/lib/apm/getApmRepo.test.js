import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

const web3 = { name: 'web3' }
const apmRepoName = 'test.aragonpm.eth'
const apmRepoVersion = '0.1.2'

const apmOptions = {}
apmOptions['ens-registry'] = '0x1234512345123451234512345123451234512345'

const progressHandler = (step) => {}

test.beforeEach('setup', t => {
  const apmStub = sinon.stub()

  const getApmRepo = proxyquire.noCallThru().load('../../../src/lib/apm/getApmRepo', {
    '@aragon/apm': apmStub,
  })

  t.context = {
    getApmRepo,
    apmStub
  }
})

test.afterEach('cleanup', t => {
  sinon.restore()
})

test.only('APM constructor gets called with the appropriate parameters', async t => {
  const { getApmRepo, apmStub } = t.context
  apmStub.returns({
    getVersion: async () => {},
    getLatestVersion: async () => {}
  })

  await getApmRepo(
    web3,
    apmRepoName,
    apmRepoVersion,
    apmOptions,
    progressHandler
  )

  t.true(
    apmStub.calledOnceWith(
      web3,
      apmOptions
    )
  )
})

// test.only('succesfully retrieves apm repo info when queried on the latest version', async t => {
//   const { getApmRepo, apmStub } = t.context
//   apmStub.returns({

//   })

//   const info = await getApmRepo(
//     web3,
//     apmRepoName,
//     apmRepoVersion,
//     apmOptions,
//     progressHandler
//   )

//   // console.log(info)
// })

// test('fails if apmOptions does not contain an ens-registry property', async t => {
//   const { getApmRepo } = t.context

//   const emptyApmOptions = {}

//   const error = await t.throwsAsync(
//     async () => {
//       await getApmRepo(
//         web3,
//         apmRepoName,
//         apmRepoVersion,
//         emptyApmOptions,
//         progressHandler
//       )
//     }
//   )

//   t.is(error.message, 'ens-registry not found in given apm options.')
// })
