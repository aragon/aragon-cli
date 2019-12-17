import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

/* Default values */

const apmRepoName = 'test.aragonpm.eth'
const apmOptions = {}
apmOptions['ens-registry'] = '0x1234512345123451234512345123451234512345'
const gasPrice = 1
const txOptions = { gasPrice }
const grantees = ['0x1234512345123451234512345123451234512345']
const progressHandler = () => {}

/* Setup and cleanup */

test.beforeEach('setup', t => {
  const web3Stub = {
    eth: {
      getAccounts: async () => ['0x1234512345123451234512345123451234512345'],
      sendTransaction: async () => {
        return {
          transactionHash:
            '0x1234512345123451234512345123451234512345123451234512345123451234',
        }
      },
    },
  }

  const apmStub = sinon.stub()
  apmStub.returns({
    getRepository: async () => {
      return {
        options: { address: '0x1234512345123451234512345123451234512345' },
      }
    },
  })

  const aclStub = sinon.stub()
  aclStub.returns({
    grant: () => {
      return {}
    },
  })

  const { default: grantNewVersionsPermission } = proxyquire
    .noCallThru()
    .load('../../src/apm/grantNewVersionsPermission', {
      '@aragon/apm': apmStub,
      './util/acl': aclStub,
    })

  t.context = {
    grantNewVersionsPermission,
    apmStub,
    aclStub,
    web3Stub,
  }
})

test.afterEach('cleanup', t => {
  sinon.restore()
})

/* Tests */

test('properly throws when transaction fails', async t => {
  const { grantNewVersionsPermission, web3Stub } = t.context

  const progressHandlerSpy = sinon.spy()

  const sendTransactionStub = sinon.stub()
  sendTransactionStub.throws('Some error')
  web3Stub.eth.sendTransaction = sendTransactionStub

  await t.throwsAsync(
    grantNewVersionsPermission(
      web3Stub,
      apmRepoName,
      apmOptions,
      grantees,
      progressHandlerSpy,
      txOptions
    )
  )
})

test('Should throw when no grantees are provided', async t => {
  const { grantNewVersionsPermission, web3Stub } = t.context

  await t.throwsAsync(
    grantNewVersionsPermission(
      web3Stub,
      apmRepoName,
      apmOptions,
      [],
      null,
      txOptions
    )
  )
})

test('properly calls the progressHandler when nothing errors', async t => {
  const { grantNewVersionsPermission, web3Stub } = t.context

  const progressHandlerSpy = sinon.spy()

  const transactionHash =
    '0x1234512345123451234512345123451234512345123451234512345123451234'
  const sendTransactionStub = sinon.stub()
  sendTransactionStub.returns({ transactionHash })
  web3Stub.eth.sendTransaction = sendTransactionStub

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandlerSpy,
    txOptions
  )

  t.is(progressHandlerSpy.callCount, 3)
  t.true(progressHandlerSpy.getCall(0).calledWith(1))
  t.true(progressHandlerSpy.getCall(1).calledWith(2, grantees[0]))
  t.true(progressHandlerSpy.getCall(2).calledWith(3, transactionHash))
})

test('properly calls web3.eth.sendTransaction() with expected transaction parameters', async t => {
  const { grantNewVersionsPermission, aclStub, web3Stub } = t.context

  const grantResponse = { name: 'grantResponse' }
  const grantStub = sinon.stub()
  grantStub.returns(grantResponse)
  aclStub.returns({ grant: grantStub })

  const sendTransactionStub = sinon.stub()
  sendTransactionStub.returns({
    transactionHash:
      '0x1234512345123451234512345123451234512345123451234512345123451234',
  })
  web3Stub.eth.sendTransaction = sendTransactionStub

  const grantees = ['0x01', '0x02', '0x02']

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  let callCounter = 0
  for (let i = 0; i < sendTransactionStub.callCount; i++) {
    const stubCall = sendTransactionStub.getCall(i)
    const arg = stubCall.args[0]
    if (arg.name && arg.name === 'grantResponse') {
      callCounter++
    }
  }

  t.is(callCounter, grantees.length)
})

test('properly calls acl.grant() with each of the grantee addresses', async t => {
  const { grantNewVersionsPermission, apmStub, aclStub, web3Stub } = t.context

  const repoAddress = '0x1234512345123451234512345123451234512345'
  apmStub.returns({
    getRepository: async () => {
      return {
        options: { address: repoAddress },
      }
    },
  })

  const grantStub = sinon.stub()
  grantStub.returns({})

  aclStub.returns({ grant: grantStub })

  const grantees = ['0x01', '0x02', '0x02']

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  t.true(grantStub.calledThrice)
  t.true(grantStub.getCall(0).calledWith(repoAddress, grantees[0]))
  t.true(grantStub.getCall(1).calledWith(repoAddress, grantees[1]))
  t.true(grantStub.getCall(2).calledWith(repoAddress, grantees[2]))
})

test('tolerates a progressHandler not being specified', async t => {
  const { grantNewVersionsPermission, web3Stub } = t.context

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  t.pass()
})

test('properly throws if apm.getRepository does not find a repository', async t => {
  const { grantNewVersionsPermission, apmStub, web3Stub } = t.context

  const getRepository = sinon.stub()
  getRepository.returns(null)

  apmStub.returns({
    getRepository,
  })

  const error = await t.throwsAsync(async () => {
    await grantNewVersionsPermission(
      web3Stub,
      apmRepoName,
      apmOptions,
      grantees,
      progressHandler,
      txOptions
    )
  })

  t.is(
    error.message,
    `Repository ${apmRepoName} does not exist and it's registry does not exist`
  )
})

test('calls apm.getRepository() with the correct parameters', async t => {
  const { grantNewVersionsPermission, apmStub, web3Stub } = t.context

  const getRepository = sinon.stub()
  getRepository.returns({
    options: { address: '0x1234512345123451234512345123451234512345' },
  })

  apmStub.returns({
    getRepository,
  })

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  t.true(getRepository.calledOnceWith(apmRepoName))
})

test('APM constructor gets called with the appropriate parameters', async t => {
  const { grantNewVersionsPermission, apmStub, web3Stub } = t.context

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  t.true(apmStub.calledOnceWith(web3Stub, apmOptions))
})

test('fails if apmOptions does not contain an ens-registry property', async t => {
  const { grantNewVersionsPermission, web3Stub } = t.context

  const emptyApmOptions = {}

  const error = await t.throwsAsync(async () => {
    await grantNewVersionsPermission(
      web3Stub,
      apmRepoName,
      emptyApmOptions,
      grantees,
      progressHandler,
      txOptions
    )
  })

  t.is(error.message, 'ens-registry not found in given apm options.')
})
