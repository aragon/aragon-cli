import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

test.beforeEach(t => {
  const utilStub = {
    getContract: sinon.stub(),
    getRecommendedGasLimit: sinon.stub(),
  }

  const tokenLib = proxyquire.noCallThru().load('../../src/lib/token', {
    '../util': utilStub,
  })

  t.context = {
    tokenLib,
    utilStub,
  }
})

test.afterEach.always(() => {
  sinon.restore()
})

test('deployMiniMeTokenFactory: should deploy a contract with the right bytecode', async t => {
  t.plan(3)
  // arrange
  const { tokenLib, utilStub } = t.context
  utilStub.getContract.returns({ bytecode: '0xFACADE' })

  const sendPromise = () => Promise.resolve()
  sendPromise.on = sinon.stub()

  const transaction = {
    send: () => sendPromise,
    estimateGas: () => 10,
  }
  const Contract = () => ({
    deploy: () => transaction,
  })
  const web3Stub = {
    eth: {
      Contract,
    },
  }
  const progressCallback = sinon.stub()
  // act
  await tokenLib.deployMiniMeTokenFactory(
    web3Stub,
    '0xSATOSHI',
    21,
    progressCallback
  )
  // assert
  t.true(
    utilStub.getContract.calledOnceWith(
      '@aragon/apps-shared-minime',
      'MiniMeTokenFactory'
    )
  )
  t.true(sendPromise.on.calledTwice)
  t.true(progressCallback.calledThrice)
})
