import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import ENS from 'ethereum-ens'
import { utils } from 'web3'


test('isIdAssigned returns false if ens.addr() throws a NameNotFound error', async t => {
  t.plan(1)

  const { isIdAssigned } = getLib({
    'ethereum-ens': getENSStub(true),
  })

  t.is(await isIdAssigned('myid', { web3: getWeb3Stub() }), false)
})

test('isIdAssigned returns true if ens.addr() returns an address', async t => {
  t.plan(1)

  const { isIdAssigned } = getLib({
    'ethereum-ens': getENSStub(false),
  })

  t.is(await isIdAssigned('myid', { web3: getWeb3Stub() }), true)
})

test('assignId throws when called with an invalid address', async t => {
  t.plan(1)

  const { assignId } = getLib({
    'ethereum-ens': getENSStub(false),
  })

  await t.throwsAsync(assignId('INVALID ADDRESS', 'id', { web3: getWeb3Stub() }), { message: /Invalid address/ })
})

test('assignId calls register() and register.send() with the correct parameters', async t => {
  t.plan(2)

  const daoAddress = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  const id = 'daoid'

  const { assignId } = getLib({
    'ethereum-ens': getENSStub(false),
  })

  const registerSendStub = sinon.stub()
  const registerStub = sinon.stub().returns({
    send: registerSendStub
  })
  const web3Stub = getWeb3Stub(registerStub)

  await assignId(daoAddress, id, { web3: web3Stub })

  t.true(registerStub.calledWith(utils.sha3(id), daoAddress))
  t.true(registerSendStub.called)
})

function getLib(loadParams) {
  return proxyquire.noCallThru().load('../../../src/lib/dao/assign-id.js', loadParams)
}

function getENSStub(throws = false) {
  const ENSStub = sinon.stub().returns({
    owner: sinon.stub(),

    resolver: sinon.stub().returns({
      addr: throws
        ? sinon.stub().throws(ENS.NameNotFound)
        : sinon.stub().returns('dao.aragonid.eth')
    })
  })
  ENSStub.NameNotFound = ENS.NameNotFound

  return ENSStub
}


function getWeb3Stub(register) {
  return {
    eth: { 
      Contract: sinon.stub().returns({
        methods: { register }
      }),
      getAccounts: sinon.stub().returns([''])
    }
  }
}