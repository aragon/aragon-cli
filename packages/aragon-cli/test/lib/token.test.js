import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

test.beforeEach(t => {
  const util = {
    getContract: sinon.stub(),
    getRecommendedGasLimit: sinon.stub(),
  }

  const tokenLib = proxyquire.noCallThru().load('../../src/lib/token', {
    '../util': util,
  })

  t.context = {
    tokenLib,
    util,
  }
})

test.afterEach.always(() => {
  sinon.restore()
})

test('deployMiniMeTokenFactory: should deploy a contract with the right bytecode', async t => {
  t.plan(6)
  // arrange
  const { tokenLib, util } = t.context
  util.getContract.returns({ bytecode: '0xFACADE' })
  util.getRecommendedGasLimit.returns(101)

  const sendPromise = () => Promise.resolve()
  sendPromise.on = sinon
    .stub()
    .onCall(0)
    .callsArgWith(1, { contractAddress: '0x00009' })
    .onCall(1)
    .callsArgWith(1, '0x0000f')

  const transaction = {
    send: sinon.stub().returns(sendPromise),
    estimateGas: () => 100,
  }
  const Contract = class {
    constructor() {
      return {
        deploy: () => transaction,
      }
    }
  }
  const web3 = {
    eth: {
      Contract,
    },
  }
  const progressCallback = sinon.stub()
  // act
  const result = await tokenLib.deployMiniMeTokenFactory(
    web3,
    '0xSATOSHI',
    21,
    progressCallback
  )
  // assert
  t.true(
    util.getContract.calledOnceWith(
      '@aragon/apps-shared-minime',
      'MiniMeTokenFactory'
    )
  )
  t.true(util.getRecommendedGasLimit.calledOnceWith(web3, 100))
  t.true(
    transaction.send.calledOnceWith({
      from: '0xSATOSHI',
      gas: 101,
      gasPrice: 21,
    })
  )
  t.true(sendPromise.on.calledTwice)
  t.true(progressCallback.calledThrice)
  t.deepEqual(result, {
    address: '0x00009',
    txHash: '0x0000f',
  })
})
