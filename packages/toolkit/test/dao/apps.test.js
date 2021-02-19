import { ens } from '@aragon/aragen'
//
import { assignId } from '../../src//dao/assign-id'
import { getAllApps, getDaoAddress } from '../../src/dao/apps'
import newDao from '../../src/dao/new'
import getApmRepo from '../../src/apm/getApmRepo'
import defaultAPMName from '../../src/helpers/default-apm'
import { getLocalWeb3 } from '../test-helpers'

let context
jest.setTimeout(60000)
beforeEach(async () => {
  const web3 = await getLocalWeb3()

  context = {
    web3,
  }
})

test('getAllApps returns the correct apps', async () => {
  const { web3 } = context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    { ensRegistryAddress: ens },
    'latest'
  )

  const daoAddress = await newDao({
    repo,
    web3,
    newInstanceMethod: 'newInstance',
    newInstanceArgs: [],
    deployEvent: 'DeployDao',
  })

  const intalledApps = await getAllApps(daoAddress, { web3 })

  expect(intalledApps.length).toBe(2)
  expect(intalledApps[0].appId).toBe(
    '0xe3262375f45a6e2026b7e7b18c2b807434f2508fe1a2a3dfb493c7df8f4aad6a'
  )
  expect(intalledApps[1].appId).toBe(
    '0xddbcfd564f642ab5627cf68b9b7d374fb4f8a36e941a75d89c87998cef03bd61'
  )
})

test('getDaoAddress returns the correct DAO address', async () => {
  const daoAddress = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  const daoName = 'mydaoname' + Math.floor(Math.random() * 1000000)
  const { web3 } = context

  await assignId(daoAddress, daoName, { web3, ensRegistry: ens })

  const result = await getDaoAddress(daoName, {
    provider: web3.currentProvider,
    registryAddress: ens,
  })

  expect(result).toBe(daoName)
})
