import test from 'ava'
import { from } from 'rxjs'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { getTransactionPath, getApps } from '../../src/helpers/aragonjs-wrapper'

const DEFAULT_ACL = '0x15737d270F7Bc777cD38592fbD50cEF74eE2F88a'
const DEFAULT_APPS = [[
  { appId: '0x01', proxyAddress: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7' }, 
  { appId: '0x02', proxyAddress: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb' }, 
  { appId: '0x03', proxyAddress: DEFAULT_ACL }
]]
const DEFAULT_FORWARDERS = [[{}]]
const DEFAULT_TRANSACTIONS= [[{}]]
const DEFAULT_PERMISSIONS = [[{}]]


function createAragonJsStub(
  apps = DEFAULT_APPS, 
  acl = DEFAULT_ACL, 
  forwarders = DEFAULT_FORWARDERS,
  transactions = DEFAULT_TRANSACTIONS,
  permissions = DEFAULT_PERMISSIONS,
  ) {

  const AragonStub = class {
      constructor() {
        this.getTransactionPath = sinon.stub()
        this.getACLTransactionPath = sinon.stub()

        this.aclProxy = { address: acl }   
      }

      async init() {}
      get apps() { return from(apps) }
      get forwarders() { return from(forwarders) }
      get transactions() { return from(transactions) }
      get permissions() { return from(permissions) }
  }

  AragonStub.ensResolve = sinon.stub().returns('0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb')

  return AragonStub
}



test('getApps returns the correct app list', async t => {
  t.plan(1)

  const AragonStub = createAragonJsStub()
  const wrapperStub = new AragonStub() 

  t.deepEqual(await getApps(wrapperStub), DEFAULT_APPS[0])
})

test('getApps waits for more elements if first list contains only 1 app', async t => {
  t.plan(1)

  const apps = [
    [{ appId: '0x01' }],
    [{ appId: '0x01' }, { appId: '0x02' }, { appId: '0x03' }]
  ]

  const AragonStub = createAragonJsStub(apps)
  const wrapperStub = new AragonStub()

  t.deepEqual(await getApps(wrapperStub), apps[1])
})

test('getTransactionPath throws if DAO does not contain app', async t => {
  t.plan(1)

  const AragonStub = createAragonJsStub()
  const wrapperStub = new AragonStub()

  await t.throwsAsync(getTransactionPath('0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Ec', 'method', [],  wrapperStub))

})

test('getTransactionPath calls wrapper getTransactionPath by default', async t => {
  t.plan(2)

  const AragonStub = createAragonJsStub()
  const wrapperStub = new AragonStub()

  const app = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  const method = 'myMethod'
  const params = ['1', '0x00001']

  await getTransactionPath(app, method, params,  wrapperStub)

  t.deepEqual(wrapperStub.getTransactionPath.args, [[app, method, params]])
  t.is(wrapperStub.getACLTransactionPath.called, false)

})

test('getTransactionPath calls wrapper getACLTransactionPath if app is the ACL', async t => {
  t.plan(2)

  const AragonStub = createAragonJsStub()
  const wrapperStub = new AragonStub()

  const app = DEFAULT_ACL
  const method = 'myAclMethod'
  const params = ['2', '0x00001']

  await getTransactionPath(app, method, params,  wrapperStub)

  t.is(wrapperStub.getTransactionPath.called, false)
  t.deepEqual(wrapperStub.getACLTransactionPath.args, [[method, params]])

})

test('initAragonJS returns an instance of the Aragon wrapper', async t => {
  t.plan(1)

  const AragonStub = createAragonJsStub()
  var { initAragonJS } = proxyquire.noCallThru().load('../../src/helpers/aragonjs-wrapper', { '@aragon/wrapper': AragonStub })

  const wrapper = await initAragonJS('test', '')

  t.is(wrapper instanceof AragonStub, true)

})

test('initAragonJS callbacks subscribe to the right observables', async t => {
  t.plan(4)

  const AragonStub = createAragonJsStub()
  var { initAragonJS } = proxyquire.noCallThru().load('../../src/helpers/aragonjs-wrapper', { '@aragon/wrapper': AragonStub })

  await initAragonJS('test', '', {
    onApps: apps => t.is(apps, DEFAULT_APPS[0]),
    onPermissions: permissions => t.is(permissions, DEFAULT_PERMISSIONS[0]),
    onForwarders: forwarders => t.is(forwarders, DEFAULT_FORWARDERS[0]),
    onTransaction: transactions => t.is(transactions, DEFAULT_TRANSACTIONS[0])
  })

})