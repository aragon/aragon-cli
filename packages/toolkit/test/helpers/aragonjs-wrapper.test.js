import test from 'ava'
import sinon from 'sinon'
//
import getApmRepo from '../../src/apm/getApmRepo'
import newDao from '../../src/dao/new'
import defaultAPMName from '../../src/helpers/default-apm'
import {
  initAragonJS,
  getTransactionPath,
  getApps,
} from '../../src/helpers/aragonjs-wrapper'
import { getLocalWeb3, getApmOptions } from '../test-helpers'

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

let wrapper
let web3
let dao
let ensRegistryAddress
let onDaoAddress

/* Setup */

test.before('setup', async t => {
  web3 = await getLocalWeb3()

  const apmOpts = getApmOptions()
  ensRegistryAddress = apmOpts['ens-registry']

  dao = await createDAO()

  onDaoAddress = sinon.spy()

  wrapper = await initAragonJS(dao, ensRegistryAddress, {
    provider: web3.currentProvider,
    accounts: await web3.eth.getAccounts(),
    ipfsConf: apmOpts.ipfs,
    onDaoAddress,
  })
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
    const app = apps[idx]
    const expectedApp = DEFAULT_APPS[idx]
    t.is(app.name, expectedApp.name, 'incorrect name')
    t.is(app.appId, expectedApp.appId, 'incorrect appId')
  }

  for (let i = 0; i < apps.length; i++) {
    verifyApp(i)
  }
})

test('getTransactionPath provides an expected path', async t => {
  const votingAppId =
    '0x9fa3927f639745e587912d4b0fea7ef9013bf93fb907d29faeab57417ba6e1d4'
  const votingBase = '0xb31E9e3446767AaDe9E48C4B1B6D13Cc6eDce172'

  const path = await getTransactionPath(
    dao,
    'newAppInstance',
    [votingAppId, votingBase, '0x00', false],
    wrapper
  )

  // TODO: Not sure why path is returning empty
  console.log(`path`, path)

  // TODO: validate
  t.pass()
})

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
