import test from 'ava'
import { from } from 'rxjs'
import sinon from 'sinon'
//
import getApmRepo from '../../src/apm/getApmRepo'
import newDao from '../../src/dao/new'
import defaultAPMName from '../../src/helpers/default-apm'
import { initAragonJS, getTransactionPath, getApps } from '../../src/helpers/aragonjs-wrapper'
import { getLocalWeb3, getApmOptions } from '../test-helpers'

const DEFAULT_ACL = '0x53e13d3a893d4a95ff4fe1480ea291fdaec51233'
const DEFAULT_APPS = [
    {
      name: 'Kernel',
      appId: '0x3b4bf6bf3ad5000ecf0f989d5befde585c6860fea3e574a4fab4c49d1c177d9c',
    },
    {
      name: 'ACL',
      appId: '0xe3262375f45a6e2026b7e7b18c2b807434f2508fe1a2a3dfb493c7df8f4aad6a',
    },
    {
      name: 'EVM Script Registry',
      appId: '0xddbcfd564f642ab5627cf68b9b7d374fb4f8a36e941a75d89c87998cef03bd61',
    },
  ]
const DEFAULT_FORWARDERS = [[{}]]
const DEFAULT_TRANSACTIONS = [[{}]]
const DEFAULT_PERMISSIONS = [[{}]]

let wrapper
let web3
let dao
let ensRegistryAddress
let onDaoAddress

/* Setup */

test.before('setup', async t => {
  web3 = await getLocalWeb3()

  ensRegistryAddress = getApmOptions()['ens-registry']
  dao = await createDAO()

  onDaoAddress = sinon.spy()

  wrapper = await initAragonJS(
    dao,
    ensRegistryAddress,
    {
      provider: web3.currentProvider,
      onDaoAddress
    }
  )
})

/* Tests */

test('onDaoAddress is called correctly', t => {
  t.is(onDaoAddress.callCount, 1)
  t.true(onDaoAddress.getCall(0).calledWith(dao))
})

test('getApps returns the correct app list', async t => {
  const apps = await getApps(wrapper)

  t.is(apps.length, DEFAULT_APPS.length)

  function verifyApp(idx) {
    let app = apps[idx]
    let expectedApp = DEFAULT_APPS[idx]
    t.is(app.name, expectedApp.name, 'incorrect name')
    t.is(app.appId, expectedApp.appId, 'incorrect appId')
  }

  for(let i = 0; i < apps.length; i++) {
    verifyApp(i)
  }
})

// TODO test getTransactionPath and getACLTransactionPath
test('getTransactionPath ...', async t => {
  const apps = await getApps(wrapper)

  const kernel = apps[0]
  const app = apps[2]

  const accounts = await web3.eth.getAccounts()

  const path = await getTransactionPath(
    kernel.proxyAddress,
    'newAppInstance',
    [app.appId, app.codeAddress],
    wrapper
  )
  console.log(path)

  t.pass()
})

// TODO test observables

/* Utils */

async function createDAO() {
  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    'latest',
    { ensRegistryAddress }
  )

  const daoAddress = await newDao({
    repo,
    web3,
    // newInstanceMethod: 'newInstance',
    newInstanceArgs: [],
    deployEvent: 'DeployDao',
  })

  return daoAddress
}
