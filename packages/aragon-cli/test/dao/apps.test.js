import test from 'ava'
import { ens } from '@aragon/aragen'
import newDao from '@aragon/toolkit/dist/dao/new'
import { assignId } from '@aragon/toolkit/dist/dao/assign-id'
import { getAllApps, getDaoAddress } from '@aragon/toolkit/dist/dao/apps'
import getApmRepo from '@aragon/toolkit/dist/apm/getApmRepo'
//
import defaultAPMName from '../../src/helpers/default-apm'
import { getLocalWeb3 } from '../utils'

test.beforeEach(async t => {
  const web3 = await getLocalWeb3()

  t.context = {
    web3,
  }
})

// eslint-disable-next-line ava/no-skip-test
test('getAllApps returns the correct apps', async t => {
  const { web3 } = t.context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    'latest',
    { ensRegistryAddress: ens }
  )

  const daoAddress = await newDao({
    repo,
    web3,
    newInstanceMethod: 'newInstance',
    newInstanceArgs: [],
    deployEvent: 'DeployDao',
  })

  const intalledApps = await getAllApps(daoAddress, { web3 })

  t.is(intalledApps.length, 2)
  t.is(
    intalledApps[0].appId,
    '0xe3262375f45a6e2026b7e7b18c2b807434f2508fe1a2a3dfb493c7df8f4aad6a',
    'ACL app id'
  )
  t.is(
    intalledApps[1].appId,
    '0xddbcfd564f642ab5627cf68b9b7d374fb4f8a36e941a75d89c87998cef03bd61',
    'EVM app id'
  )
})

test('getDaoAddress returns the correct DAO address', async t => {
  const daoAddress = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  const daoName = 'mydaoname' + Math.floor(Math.random() * 1000000)
  const { web3 } = t.context

  await assignId(daoAddress, daoName, { web3, ensRegistry: ens })

  const result = await getDaoAddress(daoName, {
    provider: web3.currentProvider,
    registryAddress: ens,
  })

  t.is(result, daoName)
})
