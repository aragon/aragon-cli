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

let wrapper
let web3
let dao
let ensRegistryAddress
let onDaoAddress
let apps

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

  apps = await getApps(wrapper)
})

/* Tests */

test('onDaoAddress is called correctly', t => {
  t.is(onDaoAddress.callCount, 1)
  t.true(onDaoAddress.getCall(0).calledWith(dao))
})

test('getApps returns the correct app list', t => {
  const reducedApps = apps.map(app => {
    return { name: app.name, appId: app.appId }
  })

  t.snapshot(reducedApps)
})

test('getTransactionPath provides an expected path', async t => {
  const voting = apps.filter(app => app.name === 'Voting')[0]

  const paths = await getTransactionPath(
    voting.proxyAddress,
    'changeSupportRequiredPct',
    ['490000000000000000'],
    wrapper
  )

  t.is(paths.length, 3)
  t.true(
    paths[1].description.includes(
      'Creates a vote to execute the desired action'
    )
  )
})

/* Utils */

async function createDAO() {
  const repo = await getApmRepo(
    web3,
    defaultAPMName('membership-template'),
    'latest',
    { ensRegistryAddress }
  )

  const daoAddress = await newDao({
    repo,
    web3,
    newInstanceMethod: 'newTokenAndInstance',
    newInstanceArgs: [
      'Token name',
      'TKN',
      'daoname' + Math.floor(Math.random() * 1000000),
      ['0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'],
      ['500000000000000000', '50000000000000000', '604800'],
      '1296000',
      true,
    ],
    deployEvent: 'DeployDao',
  })

  return daoAddress
}
