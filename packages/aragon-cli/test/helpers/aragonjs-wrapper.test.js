import test from 'ava'
import { from } from 'rxjs'
import sinon from 'sinon'
import { initAragonJS, getTransactionPath, getApps } from '../../src/helpers/aragonjs-wrapper'

const DEFAULT_ACL = '0x15737d270F7Bc777cD38592fbD50cEF74eE2F88a'
const DEFAULT_APPS_STREAM = [[
  { appId: '0x01', proxyAddress: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7' }, 
  { appId: '0x02', proxyAddress: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb' }, 
  { appId: '0x03', proxyAddress: '0x9d1C272D0541345144D943470B3a90f14c56910c' }
]]

function createAragonJsStub(apps = DEFAULT_APPS_STREAM, acl = DEFAULT_ACL) {
  return {
    apps: from(apps),

    getTransactionPath: sinon.stub(),
    getACLTransactionPath: sinon.stub(),

    aclProxy: { address: acl }    
  }
}

test('getApps returns the correct app list', async t => {
  t.plan(1)

  const wrapperStub = createAragonJsStub()

  t.deepEqual(await getApps(wrapperStub), DEFAULT_APPS_STREAM[0])
})

test('getApps waits for more elements if first list contains only 1 app', async t => {
  t.plan(1)

  const apps = [
    [{ appId: '0x01' }],
    [{ appId: '0x01' }, { appId: '0x02' }, { appId: '0x03' }]
  ]

  const wrapperStub = createAragonJsStub(apps)

  t.deepEqual(await getApps(wrapperStub), apps[1])
})

test('getTransactionPath throws if DAO does not contain app', async t => {
  t.plan(1)

  const wrapperStub = createAragonJsStub()

  await t.throwsAsync(getTransactionPath('0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Ec', 'method', [],  wrapperStub))

})

test('getTransactionPath calls wrapper getTransactionPath by default', async t => {
  t.plan(3)

  const wrapperStub = createAragonJsStub()

  const app = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  const method = 'myMethod'
  const params = ['1', '0x00001']

  await getTransactionPath(app, method, params,  wrapperStub)

  t.is(wrapperStub.getTransactionPath.called, true)
  t.deepEqual(wrapperStub.getTransactionPath.args, [[app, method, params]])
  t.is(wrapperStub.getACLTransactionPath.called, false)

})