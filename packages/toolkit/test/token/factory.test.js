import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

test.beforeEach(t => {
  const util = {
    getContract: sinon.stub(),
    getRecommendedGasLimit: sinon.stub(),
  }

  const constants = {
    ZERO_ADDRESS: '0x00000zero000addr',
  }

  const tokenLib = proxyquire.noCallThru().load('../../src/token/token', {
    '../util': util,
    '../helpers/constants': constants,
  })

  t.context = {
    tokenLib,
    util,
  }
})

test.afterEach.always(() => {
  sinon.restore()
})

test('deployMiniMeTokenFactory: should deploy the contract with the right args', async t => {
  t.plan(7)
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
  const contract = {
    deploy: sinon.stub().returns(transaction),
  }
  const web3 = {
    eth: {
      Contract: class {
        constructor() {
          return contract
        }
      },
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
  t.deepEqual(util.getContract.getCall(0).args, [
    '@aragon/apps-shared-minime',
    'MiniMeTokenFactory',
  ])
  t.deepEqual(util.getRecommendedGasLimit.getCall(0).args, [web3, 100])
  t.deepEqual(transaction.send.getCall(0).args, [
    {
      from: '0xSATOSHI',
      gas: 101,
      gasPrice: 21,
    },
  ])
  t.deepEqual(contract.deploy.getCall(0).args, [
    {
      arguments: [],
      data: '0xFACADE',
    },
  ])
  t.true(sendPromise.on.calledTwice)
  t.true(progressCallback.calledThrice)
  t.deepEqual(result, {
    address: '0x00009',
    txHash: '0x0000f',
  })
})

test('deployMiniMeToken: should deploy the contract with the right args', async t => {
  t.plan(7)
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
  const contract = {
    deploy: sinon.stub().returns(transaction),
  }
  const web3 = {
    eth: {
      Contract: class {
        constructor() {
          return contract
        }
      },
    },
  }
  const progressCallback = sinon.stub()
  // act
  const result = await tokenLib.deployMiniMeToken(
    web3,
    '0xSATOSHI',
    21,
    'New bitcoin',
    12,
    'NT',
    true,
    '0xMiniMeFactory',
    progressCallback
  )
  // assert
  t.deepEqual(util.getContract.getCall(0).args, [
    '@aragon/apps-shared-minime',
    'MiniMeToken',
  ])
  t.deepEqual(util.getRecommendedGasLimit.getCall(0).args, [web3, 100])
  t.deepEqual(transaction.send.getCall(0).args, [
    {
      from: '0xSATOSHI',
      gas: 101,
      gasPrice: 21,
    },
  ])
  t.deepEqual(contract.deploy.getCall(0).args, [
    {
      arguments: [
        '0xMiniMeFactory',
        '0x00000zero000addr',
        0,
        'New bitcoin',
        12,
        'NT',
        true,
      ],
      data: '0xFACADE',
    },
  ])
  t.true(sendPromise.on.calledTwice)
  t.true(progressCallback.calledThrice)
  t.deepEqual(result, {
    address: '0x00009',
    txHash: '0x0000f',
  })
})
