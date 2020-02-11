import test from 'ava'
//
import { assignId } from '../../src//dao/assign-id'
import { getAllApps, getDaoAddress } from '../../src/dao/apps'
import newDao from '../../src/dao/new'

test('getAllApps returns the correct apps', async t => {
  const daoAddress = await newDao()

  const intalledApps = await getAllApps(daoAddress)

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

  await assignId(daoAddress, daoName)

  const result = await getDaoAddress(daoName)

  t.is(result, daoName)
})
